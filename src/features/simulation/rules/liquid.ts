import { moveCell, swapCells } from '../grid';
import { Behavior, EMPTY, type UpdateCtx } from '../types';

const LIQUID = Behavior.Liquid;
const GAS = Behavior.Gas;

/**
 * Falling-liquid kernel: fall, slide diagonally, then disperse sideways.
 *
 * Written against the raw typed arrays with inlined bounds checks because it
 * runs for every liquid cell every tick. Semantics:
 *  - vertical moves may swap with a lighter liquid/gas (lava sinks through water)
 *  - horizontal spreading only happens under "pressure" (liquid above or below),
 *    so lone droplets and one-cell puddles rest instead of jittering
 *  - viscosity is the chance to skip lateral movement this tick
 */
export function updateLiquid(ctx: UpdateCtx, x: number, y: number, i: number, id: number): void {
  const grid = ctx.grid;
  const ids = grid.id;
  const updated = grid.updated;
  const parity = ctx.parity;
  const width = ctx.width;
  const height = ctx.height;
  const reg = ctx.registry;
  const behavior = reg.behavior;
  const densities = reg.density;
  const density = densities[id];

  const hasBelow = y + 1 < height;
  const below = i + width;
  let belowId = EMPTY;

  // One random draw feeds both the direction choice and the viscosity roll.
  const r = ctx.rng.next();
  const dir = r < 0.5 ? -1 : 1;
  const r2 = r < 0.5 ? r * 2 : (r - 0.5) * 2;

  if (hasBelow) {
    belowId = ids[below];
    if (belowId === EMPTY) {
      moveCell(grid, i, below);
      updated[below] = parity;
      return;
    }
    const bb = behavior[belowId];
    if ((bb === LIQUID || bb === GAS) && densities[belowId] < density) {
      swapCells(grid, i, below);
      updated[below] = parity;
      updated[i] = parity; // displaced cell must not act again this tick
      return;
    }

    // Diagonals: preferred direction first, then the other.
    for (let k = 0; k < 2; k++) {
      const dx = k === 0 ? dir : -dir;
      const tx = x + dx;
      if (tx < 0 || tx >= width) continue;
      const to = below + dx;
      const tid = ids[to];
      if (tid === EMPTY) {
        moveCell(grid, i, to);
        updated[to] = parity;
        return;
      }
      const tb = behavior[tid];
      if ((tb === LIQUID || tb === GAS) && densities[tid] < density) {
        swapCells(grid, i, to);
        updated[to] = parity;
        updated[i] = parity;
        return;
      }
    }
  }

  // Pressure rule.
  const liquidBelow = hasBelow && behavior[belowId] === LIQUID;
  const liquidAbove = y > 0 && behavior[ids[i - width]] === LIQUID;
  if (!liquidAbove && !liquidBelow) {
    updated[i] = parity;
    return;
  }

  const viscosity = reg.viscosity[id];
  if (viscosity > 0 && r2 < viscosity) {
    updated[i] = parity;
    return;
  }

  const maxSpread = reg.dispersion[id];
  if (maxSpread === 0) {
    updated[i] = parity;
    return;
  }

  const rowBase = y * width;
  let nx = slide(ids, rowBase, hasBelow, x, dir, maxSpread, width);
  if (nx === x) nx = slide(ids, rowBase, hasBelow, x, -dir, maxSpread, width);

  if (nx !== x) {
    const to = rowBase + nx;
    moveCell(grid, i, to);
    updated[to] = parity;
  } else {
    updated[i] = parity;
  }
}

/** Slide up to `maxSpread` empty cells in `dir`, stopping early at a ledge (empty cell below). */
function slide(
  ids: Uint8Array,
  rowBase: number,
  hasBelow: boolean,
  x: number,
  dir: number,
  maxSpread: number,
  width: number,
): number {
  const belowBase = rowBase + width;
  let nx = x;
  for (let s = 1; s <= maxSpread; s++) {
    const cx = x + dir * s;
    if (cx < 0 || cx >= width || ids[rowBase + cx] !== EMPTY) break;
    nx = cx;
    if (hasBelow && ids[belowBase + cx] === EMPTY) break;
  }
  return nx;
}
