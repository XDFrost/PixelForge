import { blast } from '../blast';
import type { UpdateCtx } from '../types';
import type { EntityWorld } from './EntityWorld';
import { LIQ, SOLID, cellClass } from './terrain';
import { BOMB_HALF, BOMB_MAX_FALL, type Bomb } from './types';

/** Classify the row just under the sprite: solid stops it, liquid slows it. */
function groundUnder(ctx: UpdateCtx, b: Bomb, y: number): number {
  let liquid = false;
  const underY = y + BOMB_HALF + 1;
  for (let dx = -BOMB_HALF; dx <= BOMB_HALF; dx++) {
    const c = cellClass(ctx, b.x + dx, underY);
    if (c === SOLID) return SOLID;
    if (c === LIQ) liquid = true;
  }
  return liquid ? LIQ : 0;
}

/**
 * Advance one bomb by one tick: fall with gravity (accelerating, one cell at a
 * time so it never tunnels), sink slowly in liquid, count the fuse down, detonate.
 */
export function tickBomb(w: EntityWorld, ctx: UpdateCtx, b: Bomb): void {
  const under = groundUnder(ctx, b, b.y);
  if (under === SOLID) {
    b.vy = 1;
  } else if (under === LIQ) {
    b.vy = 1;
    if (++b.sinkTicks % 3 === 0) b.y++;
  } else {
    for (let step = 0; step < b.vy; step++) {
      if (groundUnder(ctx, b, b.y) !== 0) break;
      b.y++;
    }
    if (b.vy < BOMB_MAX_FALL) b.vy++;
  }

  if (--b.fuse > 0) return;
  b.alive = false;
  blast(ctx, b.x, b.y, w.opts.bombRadius, w.opts.bombBlast);
}
