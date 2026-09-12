import type { UpdateCtx } from '../types';

/**
 * Temperature-driven phase change for cell `i`. The product receives its own
 * defaultTemp/defaultLife via `transform`, which also provides hysteresis
 * (e.g. steam spawns at 150 while it only condenses below 60).
 * Returns true if the cell changed element.
 */
export function applyTransition(ctx: UpdateCtx, i: number, id: number): boolean {
  const reg = ctx.registry;
  const t = ctx.grid.temp[i];
  if (t > reg.transAboveTemp[id]) {
    ctx.transform(i, reg.transAboveTo[id]);
    return true;
  }
  if (t < reg.transBelowTemp[id]) {
    ctx.transform(i, reg.transBelowTo[id]);
    return true;
  }
  return false;
}
