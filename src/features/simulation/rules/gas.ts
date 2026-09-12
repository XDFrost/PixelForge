import { moveCell, swapCells } from '../grid';
import { AMBIENT_TEMP, Behavior, EMPTY, type CompiledRegistry, type Grid, type UpdateCtx } from '../types';

const LIQUID = Behavior.Liquid;
const GAS = Behavior.Gas;
const POWDER = Behavior.Powder;

/** Enter `to` from `from`: move into empty space, or bubble up through a denser fluid or powder. */
function tryEnter(grid: Grid, reg: CompiledRegistry, from: number, to: number, myDensity: number, parity: number): boolean {
  const tid = grid.id[to];
  if (tid === EMPTY) {
    moveCell(grid, from, to);
    grid.updated[to] = parity;
    return true;
  }
  const tb = reg.behavior[tid];
  if ((tb === LIQUID || tb === GAS || tb === POWDER) && reg.density[tid] > myDensity) {
    swapCells(grid, from, to);
    grid.updated[to] = parity;
    grid.updated[from] = parity; // displaced cell must not act again this tick
    return true;
  }
  return false;
}

/** Drift up to `maxDrift` empty cells in `dir`. Gases have no ledge check. */
function drift(ids: Uint8Array, rowBase: number, x: number, dir: number, maxDrift: number, width: number): number {
  let nx = x;
  for (let s = 1; s <= maxDrift; s++) {
    const cx = x + dir * s;
    if (cx < 0 || cx >= width || ids[rowBase + cx] !== EMPTY) break;
    nx = cx;
  }
  return nx;
}

/**
 * Rising-gas kernel shared by Fire, Steam and Smoke.
 * Lifetime countdown → optional cooling → rise (up, then up-diagonals) → lateral drift.
 * Gases never move down; at the ceiling they only drift, and disappear through
 * their life countdown or a temperature transition.
 */
export function updateGas(ctx: UpdateCtx, x: number, y: number, i: number, id: number): void {
  const grid = ctx.grid;
  const ids = grid.id;
  const updated = grid.updated;
  const parity = ctx.parity;
  const width = ctx.width;
  const reg = ctx.registry;

  if (reg.defaultLife[id] > 0) {
    const l = grid.life[i] - 1;
    if (l <= 0) {
      const end = reg.lifeEnd[id];
      if (end === EMPTY) {
        ctx.clear(i);
      } else {
        ctx.transform(i, end);
        updated[i] = parity;
      }
      return;
    }
    grid.life[i] = l;
  }

  const cooling = reg.cooling[id];
  if (cooling > 0) {
    // Fractional cooling is applied as a chance to lose one degree, so a batch of
    // gas spawned together does not all condense on the same tick.
    const step = cooling >= 1 ? cooling | 0 : ctx.rng.next() < cooling ? 1 : 0;
    if (step > 0) {
      const t = grid.temp[i];
      grid.temp[i] = t - step > AMBIENT_TEMP ? t - step : AMBIENT_TEMP;
    }
  }

  // One random draw feeds both the direction choice and the rise roll.
  const r = ctx.rng.next();
  const dir = r < 0.5 ? -1 : 1;
  const r2 = r < 0.5 ? r * 2 : (r - 0.5) * 2;
  const myDensity = reg.density[id];

  if (y > 0 && r2 >= reg.riseSkip[id]) {
    const up = i - width;
    if (tryEnter(grid, reg, i, up, myDensity, parity)) return;
    for (let k = 0; k < 2; k++) {
      const dx = k === 0 ? dir : -dir;
      const tx = x + dx;
      if (tx < 0 || tx >= width) continue;
      if (tryEnter(grid, reg, i, up + dx, myDensity, parity)) return;
    }
  }

  const rowBase = y * width;
  const maxDrift = reg.dispersion[id];
  let nx = x;
  if (maxDrift > 0) {
    nx = drift(ids, rowBase, x, dir, maxDrift, width);
    if (nx === x) nx = drift(ids, rowBase, x, -dir, maxDrift, width);
  }
  if (nx !== x) {
    const to = rowBase + nx;
    moveCell(grid, i, to);
    updated[to] = parity;
  } else {
    updated[i] = parity;
  }
}
