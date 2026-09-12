import { circleOffsets } from '@/shared/lib/geometry';
import { EMPTY, type UpdateCtx } from './types';

export interface BlastOptions {
  /** Element spawned into empty cells within range (a flame). */
  fireId: number;
  fireLife: number;
  /** Base chance an empty cell in range gets a flame; falls off toward the rim. */
  pFire: number;
  /** Per-element mask (1 = may be pulverised). Pulverised cells become `debrisId` or are cleared. */
  destroyMask?: Uint8Array;
  debrisId?: number;
  debrisLife?: number;
  /** Chance at the centre that a maskable cell is pulverised; falls off toward the rim. */
  pDestroy?: number;
}

/**
 * Explosion centred on (cx, cy). Empty cells catch fire, maskable cells may be
 * pulverised, and everything else is heated to 255 so each element's own
 * transitions decide what happens next (water flashes to steam, gunpowder
 * fuses, wood/oil/plant ignite, sand vitrifies).
 *
 * Element-agnostic: all ids arrive through `opts`. Writes cells and temps only
 * and never calls hooks, so it cannot recurse; chain reactions happen on later
 * ticks through transitions.
 */
export function blast(ctx: UpdateCtx, cx: number, cy: number, radius: number, opts: BlastOptions): void {
  const { grid, width, height, rng } = ctx;
  const ids = grid.id;
  const temp = grid.temp;
  const offs = circleOffsets(radius);
  const r2 = (radius + 0.5) * (radius + 0.5);
  const pDestroy = opts.pDestroy ?? 0;

  for (let k = 0; k < offs.length; k += 2) {
    const dx = offs[k];
    const dy = offs[k + 1];
    const x = cx + dx;
    const y = cy + dy;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const i = y * width + x;
    const falloff = 1 - (dx * dx + dy * dy) / r2; // 1 at the centre → ~0 at the rim
    const id = ids[i];

    if (id === EMPTY) {
      if (rng.next() < opts.pFire * (0.4 + 0.6 * falloff)) {
        ctx.spawn(i, opts.fireId, opts.fireLife + rng.nextInt(8));
        ctx.stamp(i);
      }
      continue;
    }

    if (opts.destroyMask && opts.destroyMask[id] === 1 && rng.next() < pDestroy * falloff) {
      if (opts.debrisId === undefined) {
        ctx.clear(i);
      } else {
        ctx.transform(i, opts.debrisId, opts.debrisLife);
        ctx.stamp(i);
      }
      continue;
    }

    temp[i] = 255;
  }
}
