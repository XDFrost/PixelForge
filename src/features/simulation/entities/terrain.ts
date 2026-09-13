import { Behavior, EMPTY, type UpdateCtx } from '../types';

/** Coarse classification of a cell for creatures moving over the grid. */
export const PASS = 0; // empty or gas: walk/fall through
export const LIQ = 1; // liquid: swim
export const SOLID = 2; // static or powder, or outside the grid: ground / wall

export function cellClass(ctx: UpdateCtx, x: number, y: number): number {
  if (x < 0 || x >= ctx.width || y < 0 || y >= ctx.height) return SOLID;
  const id = ctx.grid.id[y * ctx.width + x];
  if (id === EMPTY) return PASS;
  const b = ctx.registry.behavior[id];
  return b === Behavior.Gas ? PASS : b === Behavior.Liquid ? LIQ : SOLID;
}
