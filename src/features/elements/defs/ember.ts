import { Behavior, EMPTY, type ElementDef, type UpdateCtx, type UpdateFn } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Ticks a plant cell burns before it is spent. */
export const EMBER_LIFE = 30;

export interface EmberHookOptions {
  /** Per tick: chance to throw a flame into the empty cell above. */
  pFlame: number;
  /** Per tick (when no flame): chance to release smoke into the empty cell above. */
  pSmoke: number;
  /** Life of the smoke puff left behind when the fuel is spent. */
  spentSmokeLife: number;
}

/**
 * Hook shared by every static "burning" state (plant ember, burning wood).
 * The cell stays put, counts down, emits Fire and Smoke upward, and leaves a
 * puff of smoke when spent. Heat and spreading come from the element's pinned
 * temperature and the reaction table.
 */
export function createEmberUpdate({ pFlame, pSmoke, spentSmokeLife }: EmberHookOptions): UpdateFn {
  return (ctx: UpdateCtx, _x: number, y: number, i: number): boolean => {
    const { grid, width, rng } = ctx;
    const life = grid.life[i];
    if (life <= 1) {
      ctx.transform(i, ElementId.Smoke, spentSmokeLife);
      ctx.stamp(i);
      return true;
    }
    grid.life[i] = life - 1;

    if (y > 0) {
      const above = i - width;
      if (grid.id[above] === EMPTY) {
        const r = rng.next();
        if (r < pFlame) {
          ctx.spawn(above, ElementId.Fire, 8 + rng.nextInt(12));
          ctx.stamp(above);
        } else if (r < pFlame + pSmoke) {
          ctx.spawn(above, ElementId.Smoke, 90 + rng.nextInt(120));
          ctx.stamp(above);
        }
      }
    }
    return true;
  };
}

/** Burning plant matter. */
export const ember: ElementDef = {
  id: ElementId.Ember,
  name: 'Ember',
  hidden: true,
  colors: ['#ff8c2a'],
  // life/defaultLife: 0 → burnt out grey, 1 → fresh bright flame
  lifeColors: ['#3a3a3a', '#7a2e0e', '#e0521a', '#ffb347'],
  behavior: Behavior.Static,
  density: 255,
  defaultTemp: 255,
  hazard: 'burns',
  conductivity: 0,
  defaultLife: EMBER_LIFE,
  update: createEmberUpdate({ pFlame: 0.25, pSmoke: 0.12, spentSmokeLife: 120 }),
};
