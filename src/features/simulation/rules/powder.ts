import { moveCell, swapCells } from '../grid';
import { Behavior, EMPTY, type UpdateCtx } from '../types';

const LIQUID = Behavior.Liquid;
const GAS = Behavior.Gas;

/**
 * Falling-powder kernel (sand, gunpowder): fall, sink through lighter fluids,
 * otherwise slide down one diagonal. Powders never spread sideways and never
 * swap with other powders, so piles keep a 45° rest angle. `friction` is the
 * chance to stay put when blocked, which slows slumping.
 * Stamping matches liquid.ts: moves stamp the destination, swaps stamp both.
 */
export function updatePowder(ctx: UpdateCtx, x: number, y: number, i: number, id: number): void {
  const grid = ctx.grid;
  const ids = grid.id;
  const updated = grid.updated;
  const parity = ctx.parity;
  const width = ctx.width;
  const reg = ctx.registry;
  const behavior = reg.behavior;
  const densities = reg.density;
  const density = densities[id];

  if (y + 1 >= ctx.height) {
    updated[i] = parity;
    return;
  }

  const below = i + width;
  const belowId = ids[below];
  if (belowId === EMPTY) {
    moveCell(grid, i, below);
    updated[below] = parity;
    return;
  }
  const bb = behavior[belowId];
  if ((bb === LIQUID || bb === GAS) && densities[belowId] < density) {
    swapCells(grid, i, below);
    updated[below] = parity;
    updated[i] = parity;
    return;
  }

  // Blocked below. One draw feeds the friction roll and the direction choice.
  const r = ctx.rng.next();
  const friction = reg.friction[id];
  if (friction > 0 && r < friction) {
    updated[i] = parity;
    return;
  }
  const r2 = friction > 0 ? (r - friction) / (1 - friction) : r;
  const dir = r2 < 0.5 ? -1 : 1;

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
  updated[i] = parity;
}
