import { compileRegistry } from '@/features/simulation/registry';
import { EMPTY, type ElementDef } from '@/features/simulation/types';
import { acid } from './defs/acid';
import { burningOil } from './defs/burningOil';
import { burningWood } from './defs/burningWood';
import { ember } from './defs/ember';
import { empty } from './defs/empty';
import { fire } from './defs/fire';
import { fuse } from './defs/fuse';
import { glass } from './defs/glass';
import { gunpowder } from './defs/gunpowder';
import { ice } from './defs/ice';
import { lava } from './defs/lava';
import { obsidian } from './defs/obsidian';
import { oil } from './defs/oil';
import { plant } from './defs/plant';
import { sand } from './defs/sand';
import { smoke } from './defs/smoke';
import { steam } from './defs/steam';
import { stone } from './defs/stone';
import { water } from './defs/water';
import { wood } from './defs/wood';
import { REACTIONS } from './reactions';

export { ElementId } from './ids';

/** Every element known to the engine. Visible ones first, in palette order. */
export const ELEMENT_DEFS: readonly ElementDef[] = [
  empty,
  water,
  lava,
  plant,
  fire,
  steam,
  smoke,
  obsidian,
  sand,
  stone,
  wood,
  oil,
  acid,
  ice,
  gunpowder,
  // hidden intermediates / products
  ember,
  fuse,
  burningWood,
  burningOil,
  glass,
];

/** Elements the user can pick from the palette, in display order. */
export const PALETTE_ELEMENTS: readonly ElementDef[] = ELEMENT_DEFS.filter((d) => !d.hidden && d.id !== EMPTY);

/** Compiled lookup tables shared by the engine and renderer. */
export const registry = compileRegistry(ELEMENT_DEFS, REACTIONS);

export function elementById(id: number): ElementDef | undefined {
  return registry.defs[id];
}
