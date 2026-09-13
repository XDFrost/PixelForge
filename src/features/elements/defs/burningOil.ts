import { Behavior, EMPTY, type ElementDef, type UpdateCtx } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Ticks a burning oil cell lasts (~1.5 s). */
export const OIL_BURN_LIFE = 90;
const P_FLAME = 0.2;
const P_SMOKE = 0.08;

/**
 * Burning oil stays a liquid, so it keeps floating and flowing while it burns,
 * and only its emitted flames ever touch the water below. Returns false so the
 * liquid kernel still moves the cell after the hook runs.
 */
function updateBurningLiquid(ctx: UpdateCtx, _x: number, y: number, i: number): boolean {
  const { grid, width, rng } = ctx;
  const life = grid.life[i];
  if (life <= 1) {
    ctx.transform(i, ElementId.Smoke, 40);
    ctx.stamp(i);
    return true;
  }
  grid.life[i] = life - 1;

  if (y > 0) {
    const above = i - width;
    if (grid.id[above] === EMPTY) {
      const r = rng.next();
      if (r < P_FLAME) {
        ctx.spawn(above, ElementId.Fire, 6 + rng.nextInt(10));
        ctx.stamp(above);
      } else if (r < P_FLAME + P_SMOKE) {
        ctx.spawn(above, ElementId.Smoke, 60 + rng.nextInt(60));
        ctx.stamp(above);
      }
    }
  }
  return false;
}

export const burningOil: ElementDef = {
  id: ElementId.BurningOil,
  name: 'Burning oil',
  hidden: true,
  colors: ['#ff7a1a'],
  // life/defaultLife: 0 → nearly spent dark, 1 → bright
  lifeColors: ['#3a2410', '#8a3a12', '#e06a1a', '#ffb050'],
  behavior: Behavior.Liquid,
  density: 80,
  dispersion: 3,
  viscosity: 0.2,
  defaultTemp: 255,
  hazard: 'burns',
  conductivity: 0,
  defaultLife: OIL_BURN_LIFE,
  update: updateBurningLiquid,
};
