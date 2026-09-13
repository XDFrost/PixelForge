import { EMPTY, Hazard, type UpdateCtx } from '../types';
import type { EntityWorld } from './EntityWorld';
import { LIQ, PASS, SOLID, cellClass } from './terrain';
import { HUMAN_CHEST, HUMAN_HEIGHT, HUMAN_WIDTH, HumanState, type Human } from './types';

/** Ticks between steps while walking / panicking. */
export const WALK_EVERY = 3;
export const PANIC_EVERY = 1;
/** How long a person burns before dying. */
export const BURN_TICKS = 90;
/** Ticks a person can hold their breath fully submerged. */
export const BREATH_TICKS = 300;
/** Ticks buried head-first before suffocating. */
export const SUFFOCATE_TICKS = 120;
/** Ticks of corrosive contact before dying. */
export const CORRODE_TICKS = 20;
/** Ground / neighbour temperature that sets a person alight. */
export const IGNITE_TEMP = 150;
/** Falls longer than this are fatal on landing. */
export const FATAL_FALL = 40;
const P_TURN = 1 / 200;
const P_IDLE = 1 / 150;
const P_FIRE_ABOVE = 0.15;

/** Worst terrain class across the footprint's width on one row (SOLID > LIQ > PASS). */
export function rowClass(ctx: UpdateCtx, x0: number, y: number): number {
  let c = PASS;
  for (let dx = 0; dx < HUMAN_WIDTH; dx++) {
    const k = cellClass(ctx, x0 + dx, y);
    if (k > c) c = k;
  }
  return c;
}

/** True when every footprint cell (feet at x0, fy) is passable, or liquid when allowed. */
export function footprintFree(ctx: UpdateCtx, x0: number, fy: number, allowLiquid: boolean): boolean {
  for (let r = 0; r < HUMAN_HEIGHT; r++) {
    const c = rowClass(ctx, x0, fy - r);
    if (c === SOLID || (c === LIQ && !allowLiquid)) return false;
  }
  return true;
}

// Cells checked for hazards: the footprint, the ground row, and the columns either side of the legs and torso.
const HAZARD_OFFS: number[] = [];
for (let r = 0; r < HUMAN_HEIGHT; r++) for (let dx = 0; dx < HUMAN_WIDTH; dx++) HAZARD_OFFS.push(dx, -r);
for (let dx = 0; dx < HUMAN_WIDTH; dx++) HAZARD_OFFS.push(dx, 1);
for (let r = 0; r < HUMAN_HEIGHT - 1; r++) HAZARD_OFFS.push(-1, -r, HUMAN_WIDTH, -r);

/** Advance one person by one tick. */
export function tickHuman(w: EntityWorld, ctx: UpdateCtx, h: Human, tick: number): void {
  const { grid, width, registry: reg, rng } = ctx;
  const x = h.x;
  const y = h.y;
  const feet = rowClass(ctx, x, y);
  let torso = PASS;
  for (let r = 1; r < HUMAN_HEIGHT - 1; r++) {
    const c = rowClass(ctx, x, y - r);
    if (c > torso) torso = c;
  }
  const chest = rowClass(ctx, x, y - HUMAN_CHEST);
  const head = rowClass(ctx, x, y - (HUMAN_HEIGHT - 1));
  const aboveHead = rowClass(ctx, x, y - HUMAN_HEIGHT);
  const below = rowClass(ctx, x, y + 1);

  // 1. Hazards and heat around the body.
  let hz: number = Hazard.None;
  let hot = false;
  for (let k = 0; k < HAZARD_OFFS.length; k += 2) {
    const cx = x + HAZARD_OFFS[k];
    const cy = y + HAZARD_OFFS[k + 1];
    if (!ctx.inBounds(cx, cy)) continue;
    const i = cy * width + cx;
    const id = grid.id[i];
    if (id === EMPTY) continue;
    const hzz = reg.hazard[id];
    if (hzz > hz) hz = hzz;
    if (grid.temp[i] > IGNITE_TEMP) hot = true;
  }
  if (hz === Hazard.Corrodes) {
    if (++h.corrode >= CORRODE_TICKS) {
      die(w, ctx, h, true);
      return;
    }
  } else {
    h.corrode = 0;
  }
  if ((hz === Hazard.Burns || hot) && h.state !== HumanState.Burning) {
    h.state = HumanState.Burning;
    h.burn = BURN_TICKS;
  }

  // 2. Buried: head under solid suffocates; legs/torso under powder rides the pile up.
  if (head === SOLID) {
    if (++h.suffocate >= SUFFOCATE_TICKS) die(w, ctx, h, false);
    return;
  }
  h.suffocate = 0;
  if (feet === SOLID || torso === SOLID) {
    // Climb out at half the speed sand falls, so a steady pour eventually buries them.
    if (aboveHead !== SOLID) {
      if ((tick & 1) === 0) h.y--;
    } else if (++h.suffocate >= SUFFOCATE_TICKS) {
      die(w, ctx, h, false);
    }
    return;
  }

  // 3. Burning: panic, throw flames upward, or get doused by liquid.
  if (h.state === HumanState.Burning) {
    if (chest === LIQ && hz !== Hazard.Burns) {
      h.state = HumanState.Swim;
    } else {
      if (--h.burn <= 0) {
        die(w, ctx, h, true);
        return;
      }
      const fy = y - HUMAN_HEIGHT;
      if (w.opts.fireId !== EMPTY && fy >= 0) {
        const above = fy * width + x + rng.nextInt(HUMAN_WIDTH);
        if (grid.id[above] === EMPTY && rng.next() < P_FIRE_ABOVE) {
          ctx.spawn(above, w.opts.fireId, 6 + rng.nextInt(8));
          ctx.stamp(above);
        }
      }
      if (rng.next() < 0.1) h.dir = h.dir === 1 ? -1 : 1;
    }
  }

  // 4. In liquid: tread water at the surface, rise when submerged, drown under a ceiling.
  if (chest === LIQ) {
    if (h.state !== HumanState.Burning) h.state = HumanState.Swim;
    h.fallDist = 0;
    if (head === LIQ) {
      if (++h.breath > BREATH_TICKS) {
        die(w, ctx, h, false);
        return;
      }
      if ((tick & 1) === 0 && aboveHead !== SOLID) h.y--;
    } else {
      h.breath = 0;
    }
    if (rng.next() < 0.15) tryStep(ctx, h, true);
    return;
  }
  h.breath = 0;

  // 5. Gravity: fall through air, and drop into liquid rather than walking on it.
  if (below !== SOLID) {
    if (h.state !== HumanState.Burning) h.state = HumanState.Fall;
    if (below === PASS) {
      h.y++;
      h.fallDist++;
      if (h.fallDist > 4 && rowClass(ctx, x, h.y + 1) === PASS) h.y++;
    } else if ((tick & 1) === 0) {
      h.y++; // sinking into liquid until the chest is wet
    }
    return;
  }
  if (h.fallDist > 0) {
    if (h.fallDist > FATAL_FALL) {
      die(w, ctx, h, false);
      return;
    }
    h.fallDist = 0;
  }
  if (h.state === HumanState.Fall || h.state === HumanState.Swim) h.state = HumanState.Walk;

  // 6. Idle / walk / panic.
  if (h.state === HumanState.Idle) {
    if (--h.stateTicks <= 0) h.state = HumanState.Walk;
    return;
  }
  if (h.state === HumanState.Walk && rng.next() < P_IDLE) {
    h.state = HumanState.Idle;
    h.stateTicks = 30 + rng.nextInt(60);
    return;
  }
  const every = h.state === HumanState.Burning ? PANIC_EVERY : WALK_EVERY;
  if ((tick + h.seed) % every !== 0) return;
  if (rng.next() < P_TURN) h.dir = h.dir === 1 ? -1 : 1;
  if (!tryStep(ctx, h, feet === LIQ)) h.dir = h.dir === 1 ? -1 : 1;
}

/** Move one column in `h.dir`: flat ground, a 1-cell step up, a 1-cell step down, or hop a narrow gap. */
export function tryStep(ctx: UpdateCtx, h: Human, allowLiquid: boolean): boolean {
  const nx = h.x + h.dir;
  const y = h.y;
  const ok = (c: number): boolean => c === PASS || (allowLiquid && c === LIQ);

  if (footprintFree(ctx, nx, y, allowLiquid)) {
    const under = rowClass(ctx, nx, y + 1);
    if (under === PASS) {
      // A gap no wider than the body with ground beyond it: hop across.
      const beyond = nx + h.dir * HUMAN_WIDTH;
      if (rowClass(ctx, beyond, y + 1) === SOLID && footprintFree(ctx, beyond, y, allowLiquid)) {
        h.x = beyond;
        return true;
      }
      // A 1-cell step down onto solid ground.
      if (rowClass(ctx, nx, y + 2) === SOLID && ok(rowClass(ctx, nx, y + 1))) {
        h.x = nx;
        h.y = y + 1;
        return true;
      }
    }
    h.x = nx;
    return true;
  }
  // A 1-cell step up.
  if (rowClass(ctx, nx, y) === SOLID && footprintFree(ctx, nx, y - 1, allowLiquid)) {
    h.x = nx;
    h.y = y - 1;
    return true;
  }
  return false;
}

function die(w: EntityWorld, ctx: UpdateCtx, h: Human, smoke: boolean): void {
  h.alive = false;
  h.state = HumanState.Dead;
  if (!smoke || w.opts.smokeId === EMPTY) return;
  const cy = h.y - HUMAN_CHEST;
  if (!ctx.inBounds(h.x, cy)) return;
  const i = cy * ctx.width + h.x;
  if (ctx.grid.id[i] === EMPTY) {
    ctx.spawn(i, w.opts.smokeId, 60);
    ctx.stamp(i);
  }
}
