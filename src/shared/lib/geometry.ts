/**
 * Bresenham line rasterisation. Calls `visit(x, y)` for every integer point
 * from (x0, y0) to (x1, y1) inclusive. Produces an 8-connected line.
 */
export function bresenham(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  visit: (x: number, y: number) => void,
): void {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    visit(x, y);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

const offsetCache = new Map<number, Int16Array>();

/**
 * Offsets (dx, dy pairs, flattened) of every cell inside a filled circle of the
 * given radius. Radius 0 yields the single centre cell. Cached per radius.
 */
export function circleOffsets(radius: number): Int16Array {
  const r = Math.max(0, Math.floor(radius));
  const cached = offsetCache.get(r);
  if (cached) return cached;

  const out: number[] = [];
  const r2 = (r + 0.5) * (r + 0.5);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r2) out.push(dx, dy);
    }
  }
  const arr = Int16Array.from(out);
  offsetCache.set(r, arr);
  return arr;
}

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
