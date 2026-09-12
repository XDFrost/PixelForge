import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Gunpowder hotter than this lights its fuse (blasts set neighbours to 255). */
export const GUNPOWDER_IGNITE_TEMP = 150;

/** Explosive powder. Ignition on contact lives in the reaction table; the Fuse element does the blast. */
export const gunpowder: ElementDef = {
  id: ElementId.Gunpowder,
  name: 'Gunpowder',
  colors: ['#3c3c42', '#333338', '#46464c', '#2c2c30'],
  behavior: Behavior.Powder,
  density: 160,
  friction: 0.3,
  defaultTemp: 20,
  conductivity: 32,
  transitions: { above: [GUNPOWDER_IGNITE_TEMP, ElementId.Fuse] },
};
