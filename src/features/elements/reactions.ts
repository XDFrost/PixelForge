import { EMPTY, KEEP, type ReactionRule } from '@/features/simulation/types';
import { EMBER_LIFE } from './defs/ember';
import { CRUST_CHILL } from './defs/obsidian';
import { ElementId } from './ids';

const { Water, Lava, Plant, Obsidian, Ember, Fire, Steam, Wood, Oil, Acid, Gunpowder, Fuse, BurningWood, BurningOil, Sand, Stone } =
  ElementId;

/** `a` sets wood alight. */
const ignitesWood = (a: number, p: number, mirror = true): ReactionRule => ({
  a,
  b: Wood,
  reaction: { aBecomes: KEEP, bBecomes: BurningWood, probability: p },
  mirror,
});

/** `a` sets oil alight. */
const ignitesOil = (a: number, p: number, mirror = true): ReactionRule => ({
  a,
  b: Oil,
  reaction: { aBecomes: KEEP, bBecomes: BurningOil, probability: p },
  mirror,
});

/** `a` lights gunpowder (one-way: the igniter is always the active cell). */
const lightsFuse = (a: number): ReactionRule => ({
  a,
  b: Gunpowder,
  reaction: { aBecomes: KEEP, bBecomes: Fuse, probability: 1 },
  mirror: false,
});

/** Acid eats `b` with chance `p` per contact; each dissolve spends the acid with chance `spend`. */
const dissolves = (b: number, p: number, spend: number): ReactionRule => ({
  a: Acid,
  b,
  reaction: { aBecomes: EMPTY, bBecomes: EMPTY, probability: p, aChance: spend },
  mirror: false,
});

/**
 * Contact reactions between elements. Rules are mirrored by default so the
 * outcome does not depend on which side of the pair is processed first;
 * one-way rows are used when the initiator is always an active cell (keeps
 * sand, stone and gunpowder out of the per-cell reaction scan).
 * Temperature-driven changes live on the element definitions as `transitions`.
 */
export const REACTIONS: readonly ReactionRule[] = [
  // ---- Phase 1/2 ----------------------------------------------------------
  { a: Lava, b: Water, reaction: { aBecomes: Obsidian, bBecomes: Steam, probability: 1, aLife: CRUST_CHILL } },
  { a: Lava, b: Plant, reaction: { aBecomes: KEEP, bBecomes: Ember, probability: 0.6, bLife: EMBER_LIFE } },
  { a: Ember, b: Plant, reaction: { aBecomes: KEEP, bBecomes: Ember, probability: 0.1, bLife: EMBER_LIFE }, mirror: false },
  { a: Fire, b: Plant, reaction: { aBecomes: KEEP, bBecomes: Ember, probability: 0.25, bLife: EMBER_LIFE } },
  { a: Fire, b: Water, reaction: { aBecomes: Steam, bBecomes: KEEP, probability: 1 } },

  // ---- Wood ---------------------------------------------------------------
  ignitesWood(Fire, 0.05),
  ignitesWood(Lava, 0.3),
  ignitesWood(Ember, 0.02, false),
  ignitesWood(BurningWood, 0.02, false),
  { a: BurningWood, b: Plant, reaction: { aBecomes: KEEP, bBecomes: Ember, probability: 0.08, bLife: EMBER_LIFE }, mirror: false },

  // ---- Oil ----------------------------------------------------------------
  ignitesOil(Fire, 0.3),
  ignitesOil(Lava, 0.6),
  ignitesOil(Ember, 0.15, false),
  ignitesOil(BurningWood, 0.15, false),
  ignitesOil(BurningOil, 0.3, false), // a lit slick races across its own surface

  // ---- Acid (obsidian, glass, ice and lava are acid-proof) ---------------
  dissolves(Plant, 0.15, 0.2),
  dissolves(Wood, 0.06, 0.3),
  dissolves(Sand, 0.08, 0.3),
  dissolves(Stone, 0.02, 0.4),
  dissolves(Gunpowder, 0.08, 0.3),
  { a: Acid, b: Water, reaction: { aBecomes: Water, bBecomes: KEEP, probability: 0.03 }, mirror: false },

  // ---- Gunpowder ----------------------------------------------------------
  lightsFuse(Fire),
  lightsFuse(Lava),
  lightsFuse(Ember),
  lightsFuse(BurningWood),
  lightsFuse(BurningOil),
];
