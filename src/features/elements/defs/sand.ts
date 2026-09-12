import { Behavior, type ElementDef } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Sand hotter than this fuses into glass (only blasts and lava immersion get there). */
export const SAND_MELT_TEMP = 230;

export const sand: ElementDef = {
  id: ElementId.Sand,
  name: 'Sand',
  colors: ['#e0c080', '#d4b06a', '#ecd096', '#c9a55e'],
  behavior: Behavior.Powder,
  density: 150,
  friction: 0,
  defaultTemp: 20,
  conductivity: 96,
  transitions: { above: [SAND_MELT_TEMP, ElementId.Glass] },
};
