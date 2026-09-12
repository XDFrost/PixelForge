import { Behavior, type ElementDef, type UpdateCtx } from '@/features/simulation/types';
import { ElementId } from '../ids';

/**
 * Chill generations a water-quenched obsidian cell can pass into lava.
 * Each solidified neighbour gets one less, so a splash of water builds a crust
 * roughly CRUST_CHILL + 1 cells deep rather than freezing a whole lava lake.
 */
export const CRUST_CHILL = 5;
/** Chance per tick that chilled obsidian solidifies a given lava neighbour. */
const P_SOLIDIFY = 0.12;

const DX4 = [0, 1, 0, -1] as const;
const DY4 = [1, 0, -1, 0] as const;

function updateObsidian(ctx: UpdateCtx, x: number, y: number, i: number): boolean {
  const { grid, width } = ctx;
  const ids = grid.id;
  const life = grid.life;

  // Water contact keeps this cell fully chilled.
  for (let d = 0; d < 4; d++) {
    const nx = x + DX4[d];
    const ny = y + DY4[d];
    if (ctx.inBounds(nx, ny) && ids[ny * width + nx] === ElementId.Water) {
      life[i] = CRUST_CHILL;
      break;
    }
  }

  const chill = life[i];
  if (chill === 0) return true;

  for (let d = 0; d < 4; d++) {
    const nx = x + DX4[d];
    const ny = y + DY4[d];
    if (!ctx.inBounds(nx, ny)) continue;
    const ni = ny * width + nx;
    if (ids[ni] !== ElementId.Lava) continue;
    if (ctx.rng.next() >= P_SOLIDIFY) continue;
    ctx.transform(ni, ElementId.Obsidian, chill - 1);
    ctx.stamp(ni);
  }
  return true;
}

/** Cooled lava. Paintable as an inert wall, and the product of quenching lava. */
export const obsidian: ElementDef = {
  id: ElementId.Obsidian,
  name: 'Obsidian',
  colors: ['#655d80', '#554e6c', '#746c94', '#857dab'],
  behavior: Behavior.Static,
  density: 255,
  // Born hot and conductive: glows in the heat view, then cools toward ambient.
  defaultTemp: 200,
  conductivity: 128,
  defaultLife: 0,
  update: updateObsidian,
};
