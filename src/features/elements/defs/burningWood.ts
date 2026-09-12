import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';
import { createEmberUpdate } from './ember';

/** Ticks a wood cell burns (~3 s at 60 ticks/s). */
export const WOOD_BURN_LIFE = 180;

/** Wood on fire: a slow ember that keeps throwing flames and smoke. */
export const burningWood: ElementDef = {
  id: ElementId.BurningWood,
  name: 'Burning wood',
  hidden: true,
  colors: ['#e0521a'],
  // life/defaultLife: 0 → charred, 1 → freshly caught
  lifeColors: ['#2b1a10', '#5a2a12', '#c8481a', '#ff9a3a'],
  behavior: Behavior.Static,
  density: 255,
  defaultTemp: 255,
  conductivity: 0,
  defaultLife: WOOD_BURN_LIFE,
  update: createEmberUpdate({ pFlame: 0.12, pSmoke: 0.15, spentSmokeLife: 120 }),
};
