import type { EntityWorld } from '@/features/simulation/entities';
import type { CompiledRegistry, Grid } from '@/features/simulation/types';
import { drawEntities } from './entities';
import type { HeatLut } from './heatLut';
import { VARIANTS, type Palette } from './palette';

export type ViewMode = 'normal' | 'heat';

/**
 * Fill a packed-RGBA pixel buffer from the grid using element colours.
 * Pure function so it can be unit-tested without a DOM.
 */
export function fillPixels(grid: Grid, palette: Palette, registry: CompiledRegistry, px: Uint32Array): void {
  const { id, seed, life } = grid;
  const { base, life: lifePal, usesLife } = palette;
  const defaultLife = registry.defaultLife;
  const n = grid.size;
  for (let i = 0; i < n; i++) {
    const e = id[i];
    if (usesLife[e] === 1) {
      const max = defaultLife[e];
      let bucket = ((life[i] * VARIANTS) / max) | 0;
      if (bucket >= VARIANTS) bucket = VARIANTS - 1;
      px[i] = lifePal[(e << 4) | bucket];
    } else {
      px[i] = base[(e << 4) | (seed[i] & (VARIANTS - 1))];
    }
  }
}

/** Fill a packed-RGBA pixel buffer from cell temperatures (heat view). Empty cells show the background. */
export function fillHeatPixels(grid: Grid, lut: HeatLut, px: Uint32Array): void {
  const { id, temp } = grid;
  const { colors, emptyOffset } = lut;
  const n = grid.size;
  for (let i = 0; i < n; i++) {
    px[i] = colors[temp[i] + emptyOffset[id[i]]];
  }
}

/**
 * Draws the grid into an offscreen backing canvas at 1:1 and blits it, with
 * nearest-neighbour scaling, onto the visible target canvas.
 */
export class CanvasRenderer {
  private readonly width: number;
  private readonly height: number;
  private readonly palette: Palette;
  private readonly registry: CompiledRegistry;
  private readonly heatLut: HeatLut;
  private readonly backing: HTMLCanvasElement;
  private readonly bctx: CanvasRenderingContext2D;
  private readonly image: ImageData;
  private readonly px: Uint32Array;

  constructor(width: number, height: number, palette: Palette, registry: CompiledRegistry, heatLut: HeatLut) {
    this.width = width;
    this.height = height;
    this.palette = palette;
    this.registry = registry;
    this.heatLut = heatLut;
    this.backing = document.createElement('canvas');
    this.backing.width = width;
    this.backing.height = height;
    const ctx = this.backing.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.bctx = ctx;
    this.image = ctx.createImageData(width, height);
    this.px = new Uint32Array(this.image.data.buffer);
  }

  render(grid: Grid, target: HTMLCanvasElement, mode: ViewMode = 'normal', entities?: EntityWorld, tick = 0): void {
    if (mode === 'heat') fillHeatPixels(grid, this.heatLut, this.px);
    else fillPixels(grid, this.palette, this.registry, this.px);
    if (entities) drawEntities(this.px, this.width, this.height, entities, mode === 'heat', tick);
    this.bctx.putImageData(this.image, 0, 0);
    const tctx = target.getContext('2d', { alpha: false });
    if (!tctx) return;
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(this.backing, 0, 0, this.width, this.height, 0, 0, target.width, target.height);
  }
}
