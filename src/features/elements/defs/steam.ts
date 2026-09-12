import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Steam spawns this hot and loses ~0.4°/tick, condensing back to water below 60° (~4 s). */
export const STEAM_TEMP = 150;
export const STEAM_CONDENSE_TEMP = 60;
export const STEAM_COOLING = 0.4;

/** Boiled water. Rises through liquids, cools as it climbs, then rains back down. */
export const steam: ElementDef = {
  id: ElementId.Steam,
  name: 'Steam',
  colors: ['#c9d6e2', '#b8c7d6', '#d7e2ec'],
  behavior: Behavior.Gas,
  density: 5,
  defaultTemp: STEAM_TEMP,
  conductivity: 0,
  cooling: STEAM_COOLING,
  defaultLife: 0,
  // Slightly below 1 so a painted cloud does not rise in lockstep (visible stripes).
  riseChance: 0.85,
  dispersion: 2,
  transitions: { below: [STEAM_CONDENSE_TEMP, ElementId.Water] },
};
