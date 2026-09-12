import { IS_LITTLE_ENDIAN, packRgba, parseHex, sampleGradient, type Rgb } from '@/shared/lib/color';
import { EMPTY, MAX_ELEMENTS } from '@/features/simulation/types';

/** Index offset that maps empty cells into the background half of the LUT. */
export const HEAT_EMPTY_OFFSET = 256;

export interface HeatLut {
  /** [0..255] temperature gradient, [256..511] background colour. */
  readonly colors: Uint32Array;
  /** Per element id: HEAT_EMPTY_OFFSET for EMPTY, 0 otherwise. */
  readonly emptyOffset: Uint16Array;
}

/**
 * Build the heat-view lookup table so the renderer can do
 * `px[i] = colors[temp[i] + emptyOffset[id[i]]]` with no branches.
 */
export function buildHeatLut(stops: readonly string[], backgroundHex: string, littleEndian = IS_LITTLE_ENDIAN): HeatLut {
  if (stops.length === 0) throw new Error('Heat LUT needs at least one colour stop');
  const rgbStops: Rgb[] = stops.map(parseHex);
  const colors = new Uint32Array(512);
  for (let t = 0; t < 256; t++) {
    const [r, g, b] = sampleGradient(rgbStops, t / 255);
    colors[t] = packRgba(r, g, b, 255, littleEndian);
  }
  const bg = parseHex(backgroundHex);
  colors.fill(packRgba(bg[0], bg[1], bg[2], 255, littleEndian), 256);

  const emptyOffset = new Uint16Array(MAX_ELEMENTS);
  emptyOffset[EMPTY] = HEAT_EMPTY_OFFSET;
  return { colors, emptyOffset };
}
