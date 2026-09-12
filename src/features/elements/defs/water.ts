import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

export const WATER_BOIL_TEMP = 100;

export const water: ElementDef = {
  id: ElementId.Water,
  name: 'Water',
  colors: ['#4aa3e8', '#3d94d9', '#54ace9'],
  behavior: Behavior.Liquid,
  density: 100,
  dispersion: 5,
  viscosity: 0,
  defaultTemp: 20,
  conductivity: 64,
  transitions: { above: [WATER_BOIL_TEMP, ElementId.Steam] },
};
