import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

export const lava: ElementDef = {
  id: ElementId.Lava,
  name: 'Lava',
  colors: ['#f26b1d', '#ff8c2a', '#e0521a', '#ffa03c'],
  behavior: Behavior.Liquid,
  density: 220,
  dispersion: 1,
  viscosity: 0.85,
  defaultTemp: 255,
};
