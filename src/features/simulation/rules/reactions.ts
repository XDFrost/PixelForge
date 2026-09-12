import { EMPTY, KEEP, MAX_ELEMENTS, type UpdateCtx } from '../types';

function applySide(ctx: UpdateCtx, i: number, becomes: number, life: number | undefined): void {
  if (becomes === KEEP) return;
  if (becomes === EMPTY) {
    ctx.clear(i);
    return;
  }
  ctx.transform(i, becomes, life);
}

/**
 * Check the four orthogonal neighbours of cell `i` for a matching reaction and
 * apply the first one that passes its probability roll. Returns true if a
 * reaction fired (both cells are stamped for this tick).
 *
 * The starting neighbour rotates with position and tick parity so no side is
 * systematically favoured, without spending a random draw per cell.
 */
export function tryReactions(ctx: UpdateCtx, x: number, y: number, i: number, id: number): boolean {
  const reg = ctx.registry;
  if (reg.reactive[id] === 0) return false;

  const ids = ctx.grid.id;
  const width = ctx.width;
  const height = ctx.height;
  const table = reg.reactions;
  const rowBase = id * MAX_ELEMENTS;
  const start = (x + y + (ctx.parity << 1)) & 3;

  for (let k = 0; k < 4; k++) {
    let ni: number;
    switch ((start + k) & 3) {
      case 0: // down
        if (y + 1 >= height) continue;
        ni = i + width;
        break;
      case 1: // right
        if (x + 1 >= width) continue;
        ni = i + 1;
        break;
      case 2: // up
        if (y === 0) continue;
        ni = i - width;
        break;
      default: // left
        if (x === 0) continue;
        ni = i - 1;
    }
    const nid = ids[ni];
    if (nid === EMPTY) continue;
    const r = table[rowBase + nid];
    if (r === undefined) continue;
    if (r.probability < 1 && ctx.rng.next() >= r.probability) continue;
    const ra = r.aChance;
    const rb = r.bChance;
    if (ra === undefined || ra >= 1 || ctx.rng.next() < ra) applySide(ctx, i, r.aBecomes, r.aLife);
    if (rb === undefined || rb >= 1 || ctx.rng.next() < rb) applySide(ctx, ni, r.bBecomes, r.bLife);
    ctx.stamp(i);
    ctx.stamp(ni);
    return true;
  }
  return false;
}
