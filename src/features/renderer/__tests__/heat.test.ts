import { describe, expect, it } from 'vitest';
import { ElementId } from '@/features/elements';
import { createGrid, setCell } from '@/features/simulation/grid';
import { packRgba } from '@/shared/lib/color';
import { fillHeatPixels } from '../CanvasRenderer';
import { buildHeatLut, HEAT_EMPTY_OFFSET } from '../heatLut';

const STOPS = ['#000080', '#00ffff', '#ffff00', '#ffffff'];

describe('heat view', () => {
  const lut = buildHeatLut(STOPS, '#0b0b0d', true);

  it('maps the gradient ends to the first and last stops', () => {
    expect(lut.colors[0]).toBe(packRgba(0x00, 0x00, 0x80, 255, true));
    expect(lut.colors[255]).toBe(packRgba(0xff, 0xff, 0xff, 255, true));
    expect(lut.colors[HEAT_EMPTY_OFFSET]).toBe(packRgba(0x0b, 0x0b, 0x0d, 255, true));
  });

  it('renders empty cells as background and non-empty cells by temperature', () => {
    const g = createGrid(3, 1);
    setCell(g, 1, ElementId.Obsidian, 0, 100, 0);
    setCell(g, 2, ElementId.Lava, 0, 255, 0);
    const px = new Uint32Array(3);
    fillHeatPixels(g, lut, px);
    expect(px[0]).toBe(lut.colors[HEAT_EMPTY_OFFSET]);
    expect(px[1]).toBe(lut.colors[100]);
    expect(px[2]).toBe(lut.colors[255]);
    expect(px[1]).not.toBe(px[2]);
  });
});
