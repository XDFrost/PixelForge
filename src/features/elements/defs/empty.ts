import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

export const empty: ElementDef = {
  id: ElementId.Empty,
  name: 'Empty',
  hidden: true,
  colors: ['#0b0b0d'],
  behavior: Behavior.Static,
  density: 0,
  defaultTemp: 20,
};
