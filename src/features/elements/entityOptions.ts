import type { EntityOptions } from '@/features/simulation/entities';
import { EMPTY, MAX_ELEMENTS } from '@/features/simulation/types';
import { ElementId } from './ids';

// A bomb destroys everything it reaches, obsidian included (unlike a gunpowder blast).
const BOMB_DESTROY_MASK = new Uint8Array(MAX_ELEMENTS).fill(1);
BOMB_DESTROY_MASK[EMPTY] = 0;

/** Element ids and blast parameters for people and bombs, injected into the engine. */
export const ENTITY_OPTIONS: EntityOptions = {
  fireId: ElementId.Fire,
  smokeId: ElementId.Smoke,
  bombRadius: 22,
  bombBlast: {
    fireId: ElementId.Fire,
    fireLife: 12,
    pFire: 0.6,
    destroyMask: BOMB_DESTROY_MASK,
    debrisId: ElementId.Smoke,
    debrisLife: 80,
    pDestroy: 0.85,
    entityRadius: 26,
  },
};
