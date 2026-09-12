import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Acid hotter than this boils off as smoke. */
export const ACID_BOIL_TEMP = 120;

/**
 * Corrosive liquid, denser than water. What it dissolves (and how fast) lives in
 * the reaction table; each dissolve has a chance to spend the acid cell too.
 */
export const acid: ElementDef = {
  id: ElementId.Acid,
  name: 'Acid',
  colors: ['#9be830', '#86d21f', '#b0f050', '#78c418'],
  behavior: Behavior.Liquid,
  density: 110,
  dispersion: 4,
  viscosity: 0.1,
  defaultTemp: 20,
  conductivity: 64,
  transitions: { above: [ACID_BOIL_TEMP, ElementId.Smoke] },
};
