import { describe, expect, it } from 'vitest';
import { registry, ElementId } from '@/features/elements';
import { createGrid, setCell } from '@/features/simulation/grid';
import { packRgba } from '@/shared/lib/color';
import { fillPixels } from '../CanvasRenderer';
import { buildPalette, VARIANTS } from '../palette';

describe('packRgba', () => {
  it('lands as [R,G,B,A] in memory on little-endian hosts', () => {
    const buf = new Uint32Array(1);
    buf[0] = packRgba(0x11, 0x22, 0x33, 0x44, true);
    expect(Array.from(new Uint8Array(buf.buffer))).toEqual(
      new Uint8Array(new Uint32Array([1]).buffer)[0] === 1 ? [0x11, 0x22, 0x33, 0x44] : [0x44, 0x33, 0x22, 0x11],
    );
  });

  it('produces mirrored words for the two byte orders', () => {
    expect(packRgba(1, 2, 3, 4, true)).toBe(0x04030201);
    expect(packRgba(1, 2, 3, 4, false)).toBe(0x01020304);
  });
});

describe('palette + fillPixels', () => {
  const palette = buildPalette(registry, '#0b0b0d', true);

  it('maps empty cells to the background colour', () => {
    expect(palette.base[0]).toBe(packRgba(0x0b, 0x0b, 0x0d, 255, true));
  });

  it('gives each element 16 opaque variants', () => {
    for (const id of [ElementId.Water, ElementId.Lava, ElementId.Plant]) {
      for (let v = 0; v < VARIANTS; v++) {
        const c = palette.base[(id << 4) | v];
        expect(c >>> 24).toBe(255);
        expect(c).not.toBe(palette.base[0]);
      }
    }
  });

  it('uses the life gradient for embers', () => {
    expect(palette.usesLife[ElementId.Ember]).toBe(1);
    const g = createGrid(2, 1);
    setCell(g, 0, ElementId.Ember, 0, 0, registry.defaultLife[ElementId.Ember]);
    setCell(g, 1, ElementId.Ember, 0, 0, 1);
    const px = new Uint32Array(2);
    fillPixels(g, palette, registry, px);
    expect(px[0]).not.toBe(px[1]);
    expect(px[0]).toBe(palette.life[(ElementId.Ember << 4) | 15]);
  });
});
