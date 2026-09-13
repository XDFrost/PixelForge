import type { Rng } from '@/shared/lib/rng';
import type { UpdateCtx } from '../types';
import { tickBomb } from './bomb';
import { footprintFree, tickHuman } from './human';
import {
  BOMB_FUSE,
  BOMB_HALF,
  HUMAN_CHEST,
  HUMAN_HEIGHT,
  HUMAN_WIDTH,
  HumanState,
  MAX_BOMBS,
  MAX_HUMANS,
  NO_ENTITY_OPTIONS,
  type Bomb,
  type EntityOptions,
  type Human,
} from './types';

/**
 * Everything that lives on top of the grid rather than in it: people and bombs.
 * Entities read the grid to decide what to do; the cellular automata never see them.
 * `tick` early-outs when empty so an entity-free engine pays nothing.
 */
export class EntityWorld {
  readonly humans: Human[] = [];
  readonly bombs: Bomb[] = [];
  readonly opts: EntityOptions;

  constructor(opts: EntityOptions = NO_ENTITY_OPTIONS) {
    this.opts = opts;
  }

  get count(): number {
    return this.humans.length + this.bombs.length;
  }

  get humanCount(): number {
    return this.humans.length;
  }

  /** Place a person with their feet at (x, y), nudging upward to find a free footprint. */
  spawnHuman(ctx: UpdateCtx, x: number, y: number): Human | null {
    if (this.humans.length >= MAX_HUMANS) return null;
    const cx = clamp(x, 0, ctx.width - HUMAN_WIDTH);
    const minY = HUMAN_HEIGHT - 1;
    let fy = clamp(y, minY, ctx.height - 1);
    for (let k = 0; k < 8 && fy >= minY; k++, fy--) {
      // Air or liquid is fine (people can be dropped into water); solids are not.
      if (footprintFree(ctx, cx, fy, true)) {
        const h: Human = {
          x: cx,
          y: fy,
          dir: ctx.rng.next() < 0.5 ? -1 : 1,
          state: HumanState.Fall,
          stateTicks: 0,
          fallDist: 0,
          breath: 0,
          burn: 0,
          corrode: 0,
          suffocate: 0,
          seed: ctx.rng.nextByte(),
          alive: true,
        };
        this.humans.push(h);
        return h;
      }
    }
    return null;
  }

  /** Place a bomb centred at (x, y), clamped so the 5×5 sprite stays in the grid. */
  spawnBomb(ctx: UpdateCtx, x: number, y: number): Bomb | null {
    if (this.bombs.length >= MAX_BOMBS) return null;
    const b: Bomb = {
      x: clamp(x, BOMB_HALF, ctx.width - 1 - BOMB_HALF),
      y: clamp(y, BOMB_HALF, ctx.height - 1 - BOMB_HALF),
      fuse: BOMB_FUSE,
      vy: 1,
      sinkTicks: 0,
      alive: true,
    };
    this.bombs.push(b);
    return b;
  }

  tick(ctx: UpdateCtx, tickNo: number): void {
    if (this.count === 0) return;
    for (const b of this.bombs) if (b.alive) tickBomb(this, ctx, b);
    for (const h of this.humans) if (h.alive) tickHuman(this, ctx, h, tickNo);
    sweep(this.humans);
    sweep(this.bombs);
  }

  /**
   * Blast effect on entities: people within `r` die; other bombs within `r` get a
   * very short fuse so they go off on a later tick (never inline, so no recursion).
   */
  applyBlast(cx: number, cy: number, r: number, rng: Rng): void {
    const r2 = (r + 0.5) * (r + 0.5);
    for (const h of this.humans) {
      const dx = h.x + (HUMAN_WIDTH - 1) / 2 - cx;
      const dy = h.y - HUMAN_CHEST - cy;
      if (dx * dx + dy * dy <= r2) {
        h.alive = false;
        h.state = HumanState.Dead;
      }
    }
    for (const b of this.bombs) {
      if (!b.alive) continue;
      const dx = b.x - cx;
      const dy = b.y - cy;
      // At least 2 so a bomb processed later in the same tick still goes off on a later one.
      if (dx * dx + dy * dy <= r2 && b.fuse > 4) b.fuse = 2 + rng.nextInt(3);
    }
  }

  /** Eraser support: remove people and bombs touching the circle. */
  removeInCircle(cx: number, cy: number, r: number): void {
    const r2 = (r + 0.5) * (r + 0.5);
    for (const h of this.humans) {
      outer: for (let k = 0; k < HUMAN_HEIGHT; k++) {
        const dy = h.y - k - cy;
        for (let c = 0; c < HUMAN_WIDTH; c++) {
          const dx = h.x + c - cx;
          if (dx * dx + dy * dy <= r2) {
            h.alive = false;
            break outer;
          }
        }
      }
    }
    for (const b of this.bombs) {
      const dx = b.x - cx;
      const dy = b.y - cy;
      if (dx * dx + dy * dy <= (r + BOMB_HALF + 0.5) ** 2) b.alive = false;
    }
    sweep(this.humans);
    sweep(this.bombs);
  }

  clear(): void {
    this.humans.length = 0;
    this.bombs.length = 0;
  }
}

/** Remove dead entries in place (order not preserved). */
function sweep<T extends { alive: boolean }>(list: T[]): void {
  let i = 0;
  while (i < list.length) {
    if (list[i].alive) {
      i++;
    } else {
      list[i] = list[list.length - 1];
      list.pop();
    }
  }
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
