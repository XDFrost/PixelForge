import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Wood hotter than this catches fire. */
export const WOOD_IGNITE_TEMP = 200;

export const wood: ElementDef = {
  id: ElementId.Wood,
  name: 'Wood',
  colors: ['#8b5a2b', '#7a4e24', '#9c6633', '#6e4520'],
  behavior: Behavior.Static,
  density: 255,
  defaultTemp: 20,
  conductivity: 64,
  transitions: { above: [WOOD_IGNITE_TEMP, ElementId.BurningWood] },
};
