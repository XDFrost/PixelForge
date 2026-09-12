/**
 * Stable element ids. Append only — never renumber, since saved scenes and
 * tests depend on these values.
 */
export const ElementId = {
  Empty: 0,
  Water: 1,
  Lava: 2,
  Plant: 3,
  Obsidian: 4,
  Ember: 5,
  Fire: 6,
  Steam: 7,
  Smoke: 8,
  Sand: 9,
  Stone: 10,
  Wood: 11,
  Oil: 12,
  Acid: 13,
  Ice: 14,
  Gunpowder: 15,
  Fuse: 16,
  BurningWood: 17,
  BurningOil: 18,
  Glass: 19,
} as const;

export type ElementId = (typeof ElementId)[keyof typeof ElementId];
