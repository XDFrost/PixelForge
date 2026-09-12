import { IS_LITTLE_ENDIAN, adjustBrightness, packRgba, parseHex, sampleGradient, type Rgb } from '@/shared/lib/color';
import { MAX_ELEMENTS, type CompiledRegistry } from '@/features/simulation/types';

/** Variants per element (indexed by the low 4 bits of the cell seed). */
export const VARIANTS = 16;

// Deterministic brightness jitter (percent) per variant so grains differ subtly.
const JITTER = [0, -3, 2, -1, 3, -2, 1, -4, 4, 0, -2, 2, -3, 1, -1, 3] as const;

export interface Palette {
  /** base[(id << 4) | variant] → packed RGBA. */
  readonly base: Uint32Array;
  /** life[(id << 4) | lifeBucket] → packed RGBA, for elements with lifeColors. */
  readonly life: Uint32Array;
  /** 1 when the element's colour is driven by its life value. */
  readonly usesLife: Uint8Array;
}

export function buildPalette(registry: CompiledRegistry, backgroundHex: string, littleEndian = IS_LITTLE_ENDIAN): Palette {
  const base = new Uint32Array(MAX_ELEMENTS * VARIANTS);
  const life = new Uint32Array(MAX_ELEMENTS * VARIANTS);
  const usesLife = new Uint8Array(MAX_ELEMENTS);

  const bg = parseHex(backgroundHex);
  const bgPacked = packRgba(bg[0], bg[1], bg[2], 255, littleEndian);
  base.fill(bgPacked);

  for (let id = 0; id < MAX_ELEMENTS; id++) {
    const def = registry.defs[id];
    if (!def) continue;
    const colors: Rgb[] = def.colors.map(parseHex);
    for (let v = 0; v < VARIANTS; v++) {
      const rgb = id === 0 ? bg : adjustBrightness(colors[v % colors.length], JITTER[v]);
      base[(id << 4) | v] = packRgba(rgb[0], rgb[1], rgb[2], 255, littleEndian);
    }
    if (def.lifeColors && def.lifeColors.length > 0 && registry.defaultLife[id] > 0) {
      usesLife[id] = 1;
      const stops: Rgb[] = def.lifeColors.map(parseHex);
      for (let v = 0; v < VARIANTS; v++) {
        const rgb = sampleGradient(stops, v / (VARIANTS - 1));
        life[(id << 4) | v] = packRgba(rgb[0], rgb[1], rgb[2], 255, littleEndian);
      }
    }
  }
  return { base, life, usesLife };
}
