import { Behavior, EMPTY, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Ticks a painted smoke cell lingers (~3.5 s). */
export const SMOKE_LIFE = 210;

/** Lazy, drifting combustion product that thins out and vanishes. */
export const smoke: ElementDef = {
  id: ElementId.Smoke,
  name: 'Smoke',
  colors: ['#55555c'],
  // life/defaultLife: 0 → almost background, 1 → fresh thick smoke
  lifeColors: ['#121214', '#2e2e33', '#55555c', '#6e6e75'],
  behavior: Behavior.Gas,
  density: 3,
  defaultTemp: 80,
  conductivity: 0,
  defaultLife: SMOKE_LIFE,
  lifeEnd: EMPTY,
  riseChance: 0.5,
  dispersion: 2,
};
