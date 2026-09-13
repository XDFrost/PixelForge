import { blast, type BlastOptions } from '@/features/simulation/blast';
import { Behavior, MAX_ELEMENTS, type ElementDef, type UpdateCtx } from '@/features/simulation/types';
import { ElementId } from '../ids';

/** Ticks between ignition and detonation; sets the visible chain speed. */
export const FUSE_LIFE = 5;
export const BLAST_RADIUS = 6;

const DESTROY_MASK = new Uint8Array(MAX_ELEMENTS);
for (const id of [ElementId.Sand, ElementId.Plant, ElementId.Wood, ElementId.Stone, ElementId.Ice, ElementId.Glass]) {
  DESTROY_MASK[id] = 1;
}

/** Obsidian, water and lava are never pulverised, so basins survive and water flashes to steam via the heat. */
export const BLAST_OPTIONS: BlastOptions = {
  fireId: ElementId.Fire,
  fireLife: 10,
  pFire: 0.7,
  destroyMask: DESTROY_MASK,
  debrisId: ElementId.Smoke,
  debrisLife: 60,
  pDestroy: 0.5,
};

/** Counts down while still falling, then clears itself and detonates. */
function updateFuse(ctx: UpdateCtx, x: number, y: number, i: number): boolean {
  const life = ctx.grid.life[i];
  if (life > 1) {
    ctx.grid.life[i] = life - 1;
    return false; // keep falling like the powder it was
  }
  ctx.clear(i); // the centre is empty when the blast runs, so it gets a flame
  blast(ctx, x, y, BLAST_RADIUS, BLAST_OPTIONS);
  return true;
}

/** Lit gunpowder. Hidden intermediate state that makes chains propagate visibly. */
export const fuse: ElementDef = {
  id: ElementId.Fuse,
  name: 'Fuse',
  hidden: true,
  colors: ['#fff3b0'],
  // life/defaultLife: 0 → white flash, 1 → yellow spark
  lifeColors: ['#ffffff', '#fff3b0', '#ffd24a', '#ff9a2a'],
  behavior: Behavior.Powder,
  density: 160,
  friction: 1,
  defaultTemp: 255,
  hazard: 'burns',
  conductivity: 0,
  defaultLife: FUSE_LIFE,
  update: updateFuse,
};
