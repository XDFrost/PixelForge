import { ElementId } from '@/features/elements';

/** One-line descriptions shown in the element info card. */
export const ELEMENT_DESCRIPTIONS: Readonly<Record<number, string>> = {
  [ElementId.Water]: 'Flows, pools and levels out. Quenches lava and fire into steam, feeds nearby plants, boils when heated.',
  [ElementId.Lava]: 'Heavy, slow and white-hot. Sinks through water, sets plants alight, crusts into obsidian when quenched.',
  [ElementId.Plant]: 'Grows toward water and drinks it. Catches fire from flames, lava or enough heat.',
  [ElementId.Fire]: 'A short-lived flame that rises and flickers. Ignites plants, wood, oil and gunpowder; water snuffs it into steam.',
  [ElementId.Steam]: 'Rises through everything, cools as it climbs, then rains back down as water.',
  [ElementId.Smoke]: 'Lazy, drifting and thinning. Fades away after a while.',
  [ElementId.Obsidian]: 'Cooled lava. Inert, immovable and acid-proof; use it for walls, floors and basins.',
  [ElementId.Sand]: 'Falls and piles into slopes. Sinks in water. Fuses into glass under extreme heat.',
  [ElementId.Stone]: 'Plain grey wall. Inert, but acid eats through it slowly.',
  [ElementId.Wood]: 'Solid fuel. Catches from flames or lava and burns for seconds, throwing fire and smoke.',
  [ElementId.Oil]: 'Floats on water and spreads thin. Extremely flammable; a burning slick keeps floating as it burns.',
  [ElementId.Acid]: 'Sinks in water and dissolves plant, wood, sand, stone and gunpowder. Each bite spends a little acid.',
  [ElementId.Ice]: 'Freezing cold. Grows a sheet into adjacent still water, melts near heat.',
  [ElementId.Gunpowder]: 'Dark powder that piles steeply. Any flame lights a fuse that races along it and blasts.',
  [ElementId.Ember]: 'Burning plant matter. Throws flames and smoke, then burns out.',
  [ElementId.Fuse]: 'Lit gunpowder about to detonate.',
  [ElementId.BurningWood]: 'Wood on fire. Burns slowly, spreads to neighbours.',
  [ElementId.BurningOil]: 'Oil on fire. Keeps floating while it burns off.',
  [ElementId.Glass]: 'Fused sand. Inert and acid-proof.',
};

export const describeElement = (id: number): string => ELEMENT_DESCRIPTIONS[id] ?? '';
