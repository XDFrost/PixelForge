import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Oil hotter than this catches fire. */
export const OIL_IGNITE_TEMP = 180;

/** Lighter than water, so it floats; very flammable. */
export const oil: ElementDef = {
  id: ElementId.Oil,
  name: 'Oil',
  colors: ['#5a4630', '#4d3a26', '#6b5438', '#3f3020'],
  behavior: Behavior.Liquid,
  density: 80,
  dispersion: 3,
  viscosity: 0.2,
  defaultTemp: 20,
  conductivity: 96,
  transitions: { above: [OIL_IGNITE_TEMP, ElementId.BurningOil] },
};
