import { AMBIENT_TEMP, EMPTY, MAX_ELEMENTS, type CompiledRegistry, type Grid } from '../types';

/** Run the diffusion pass every N ticks. */
export const HEAT_EVERY = 2;
/** Decay toward ambient per pass is 1 + (|Δ| >> HEAT_DECAY_SHIFT). */
export const HEAT_DECAY_SHIFT = 5;

// Empty cells store temp 0 but are read as ambient: add this per neighbour id.
const AMBIENT_OF = new Uint8Array(MAX_ELEMENTS);
AMBIENT_OF[EMPTY] = AMBIENT_TEMP;

/**
 * One explicit heat-diffusion step over rows y0..y1 (inclusive).
 *
 * For every cell whose element has non-zero conductivity c (0..256):
 *   t' = t + ((Σ neighbours − 4t) · c) >> 10        (convex mix ⇒ stays within neighbour range)
 *   then decay toward ambient by 1 + (|t' − ambient| >> HEAT_DECAY_SHIFT)  (never overshoots)
 * Elements with conductivity 0 (heat sources, gases, empty) keep their temperature but
 * are still read by their neighbours. Out-of-bounds neighbours contribute no flux.
 * Reads `temp`, writes `scratch`, then copies the band back, so scan order cannot bias it.
 */
export function diffuseHeat(grid: Grid, reg: CompiledRegistry, scratch: Uint8Array, y0: number, y1: number): void {
  const { width, height } = grid;
  const ids = grid.id;
  const temp = grid.temp;
  const cond = reg.conductivity;
  const from = y0 * width;
  const to = (y1 + 1) * width;

  scratch.set(temp.subarray(from, to), from);

  for (let y = y0; y <= y1; y++) {
    const rowBase = y * width;
    for (let x = 0; x < width; x++) {
      const i = rowBase + x;
      const c = cond[ids[i]];
      if (c === 0) continue;
      const t = temp[i];
      const up = y > 0 ? temp[i - width] + AMBIENT_OF[ids[i - width]] : t;
      const dn = y + 1 < height ? temp[i + width] + AMBIENT_OF[ids[i + width]] : t;
      const lf = x > 0 ? temp[i - 1] + AMBIENT_OF[ids[i - 1]] : t;
      const rt = x + 1 < width ? temp[i + 1] + AMBIENT_OF[ids[i + 1]] : t;
      let nt = t + (((up + dn + lf + rt - 4 * t) * c) >> 10);
      if (nt > AMBIENT_TEMP) nt -= 1 + ((nt - AMBIENT_TEMP) >> HEAT_DECAY_SHIFT);
      else if (nt < AMBIENT_TEMP) nt += 1 + ((AMBIENT_TEMP - nt) >> HEAT_DECAY_SHIFT);
      scratch[i] = nt;
    }
  }

  temp.set(scratch.subarray(from, to), from);
}
