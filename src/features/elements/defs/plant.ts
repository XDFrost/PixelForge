import { Behavior, EMPTY, type ElementDef, type UpdateCtx } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Fraction of plant cells that run growth logic on a given tick (CPU guard). */
export const PLANT_EVAL_RATE = 0.15;
/** Chance per evaluation to absorb an adjacent water cell. */
export const P_GROW_WET = 0.9;
/** Chance per evaluation to grow into empty space with no water nearby. */
export const P_GROW_DRY = 0.08;
/** Hard cap on how far (in generations) a plant can grow from its seed. */
export const MAX_GENERATION = 40;
/** Without water a seed only becomes a small bush. */
export const DRY_MAX_GENERATION = 16;
/** Plant hotter than this catches fire. */
export const PLANT_IGNITE_TEMP = 160;

// Orthogonal neighbours for water lookup.
const DX4 = [0, 1, 0, -1] as const;
const DY4 = [1, 0, -1, 0] as const;

// Dry growth targets and weights: up 5, up-diagonals 2, sides 1, never down.
const GROW_DX = [0, -1, 1, -1, 1] as const;
const GROW_DY = [-1, -1, -1, 0, 0] as const;
const GROW_W = [5, 2, 2, 1, 1] as const;
const GROW_TOTAL = 11;

function updatePlant(ctx: UpdateCtx, x: number, y: number, i: number): boolean {
  const { rng, grid, width } = ctx;
  if (rng.next() > PLANT_EVAL_RATE) return true;

  const gen = grid.life[i];
  if (gen >= MAX_GENERATION) return true;

  // 1) Absorb adjacent water: the water cell becomes plant (mass-conserving growth).
  const start = rng.nextInt(4);
  for (let k = 0; k < 4; k++) {
    const d = (start + k) & 3;
    const nx = x + DX4[d];
    const ny = y + DY4[d];
    if (!ctx.inBounds(nx, ny)) continue;
    const ni = ny * width + nx;
    if (grid.id[ni] !== ElementId.Water) continue;
    if (rng.next() < P_GROW_WET) {
      ctx.transform(ni, ElementId.Plant, gen + 1);
      ctx.stamp(ni);
    }
    return true;
  }

  // 2) Dry growth: rare, upward-biased, tightly capped.
  if (gen >= DRY_MAX_GENERATION || rng.next() > P_GROW_DRY) return true;
  let pick = rng.nextInt(GROW_TOTAL);
  let t = 0;
  while (pick >= GROW_W[t]) {
    pick -= GROW_W[t];
    t++;
  }
  const tx = x + GROW_DX[t];
  const ty = y + GROW_DY[t];
  if (!ctx.inBounds(tx, ty)) return true;
  const ti = ty * width + tx;
  if (grid.id[ti] === EMPTY) {
    ctx.spawn(ti, ElementId.Plant, gen + 1);
    ctx.stamp(ti);
  }
  return true;
}

export const plant: ElementDef = {
  id: ElementId.Plant,
  name: 'Plant',
  colors: ['#5cc24a', '#4fb03f', '#6ad256', '#45a338'],
  behavior: Behavior.Static,
  density: 255,
  defaultTemp: 20,
  conductivity: 96,
  defaultLife: 0,
  transitions: { above: [PLANT_IGNITE_TEMP, ElementId.Ember] },
  update: updatePlant,
};
