import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Inert grey wall. No hook and no transition, so the engine skips it entirely. */
export const stone: ElementDef = {
  id: ElementId.Stone,
  name: 'Stone',
  colors: ['#8a8a92', '#7c7c84', '#96969e', '#70707a'],
  behavior: Behavior.Static,
  density: 255,
  defaultTemp: 20,
  conductivity: 32,
};
