import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Fused sand. Inert, acid-proof. Reaction product only. */
export const glass: ElementDef = {
  id: ElementId.Glass,
  name: 'Glass',
  hidden: true,
  colors: ['#9fc4d4', '#b6d6e3', '#8db8ca', '#c4e0ea'],
  behavior: Behavior.Static,
  density: 255,
  defaultTemp: 20,
  conductivity: 64,
};
