export type Rgb = readonly [r: number, g: number, b: number];

/** Parse `#rgb` or `#rrggbb` into 0..255 channels. */
export function parseHex(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex colour: ${hex}`);
  const n = parseInt(h, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Host byte order — `ImageData` is RGBA in memory, so packing a u32 depends on it. */
export const IS_LITTLE_ENDIAN: boolean = new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;

/**
 * Pack RGBA channels into a u32 that, when written through a Uint32Array view
 * over `ImageData.data`, lands in memory as [R, G, B, A].
 */
export function packRgba(r: number, g: number, b: number, a = 255, littleEndian = IS_LITTLE_ENDIAN): number {
  return littleEndian
    ? ((a << 24) | (b << 16) | (g << 8) | r) >>> 0
    : ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

const clamp255 = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : v) | 0;

/** Scale brightness by a percentage delta (e.g. -5 darkens 5%). */
export function adjustBrightness([r, g, b]: Rgb, percent: number): Rgb {
  const k = 1 + percent / 100;
  return [clamp255(r * k), clamp255(g * k), clamp255(b * k)];
}

export function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [clamp255(a[0] + (b[0] - a[0]) * t), clamp255(a[1] + (b[1] - a[1]) * t), clamp255(a[2] + (b[2] - a[2]) * t)];
}

/** Sample a multi-stop gradient at t in [0, 1]. */
export function sampleGradient(stops: readonly Rgb[], t: number): Rgb {
  if (stops.length === 1) return stops[0];
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const pos = clamped * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(pos));
  return lerpRgb(stops[i], stops[i + 1], pos - i);
}
