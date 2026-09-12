import { Behavior, type ElementDef, type UpdateCtx } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Ice hotter than this melts back to water. */
export const ICE_MELT_TEMP = 60;
/** How many generations painted ice can freeze into adjacent water (sheet ≈ reach + 1 cells). */
export const FREEZE_REACH = 4;
/** Water warmer than this will not freeze. */
const FREEZE_MAX_WATER_TEMP = 30;
const ICE_EVAL_RATE = 0.2;
const P_FREEZE = 0.15;

const DX4 = [0, 1, 0, -1] as const;
const DY4 = [1, 0, -1, 0] as const;

/**
 * Freezes cool adjacent water, each generation with one less reach, so a
 * painted edge grows a bounded sheet rather than freezing a whole lake.
 * Mirror of the obsidian crust mechanic.
 */
function updateIce(ctx: UpdateCtx, x: number, y: number, i: number): boolean {
  const { grid, width, rng } = ctx;
  const reach = grid.life[i];
  if (reach === 0 || rng.next() > ICE_EVAL_RATE) return true;
  for (let d = 0; d < 4; d++) {
    const nx = x + DX4[d];
    const ny = y + DY4[d];
    if (!ctx.inBounds(nx, ny)) continue;
    const ni = ny * width + nx;
    if (grid.id[ni] !== ElementId.Water || grid.temp[ni] >= FREEZE_MAX_WATER_TEMP) continue;
    if (rng.next() >= P_FREEZE) continue;
    ctx.transform(ni, ElementId.Ice, reach - 1);
    ctx.stamp(ni);
  }
  return true;
}

export const ice: ElementDef = {
  id: ElementId.Ice,
  name: 'Ice',
  colors: ['#bfe6f7', '#a9d9ef', '#d2eefa', '#98cde8'],
  behavior: Behavior.Static,
  density: 255,
  // Born freezing; conducts, so it warms to ambient unless it keeps a cold neighbour.
  defaultTemp: 0,
  conductivity: 128,
  defaultLife: FREEZE_REACH,
  transitions: { above: [ICE_MELT_TEMP, ElementId.Water] },
  update: updateIce,
};
