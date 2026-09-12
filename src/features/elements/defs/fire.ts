import { Behavior, EMPTY, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Ticks a painted flame lives. Embers spawn shorter-lived flames. */
export const FIRE_LIFE = 16;

/** The visible flame: a hot, short-lived gas that ignites plants and is quenched by water. */
export const fire: ElementDef = {
  id: ElementId.Fire,
  name: 'Fire',
  colors: ['#ff9a2a', '#ffb347', '#ff7a1a'],
  // life/defaultLife: 0 → dying dark red, 1 → fresh pale yellow
  lifeColors: ['#4a1205', '#d9481a', '#ffb347', '#fff0a8'],
  behavior: Behavior.Gas,
  density: 1,
  defaultTemp: 255,
  conductivity: 0,
  defaultLife: FIRE_LIFE,
  lifeEnd: EMPTY,
  riseChance: 0.8,
  dispersion: 1,
};
