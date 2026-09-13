import type { Rng } from '@/shared/lib/rng';

/** Element id of an empty cell. Always 0. */
export const EMPTY = 0;
/** Sentinel for reactions: "this side keeps its element". */
export const KEEP = -1;
/** Maximum number of element ids (Uint8). */
export const MAX_ELEMENTS = 256;
/** `Grid.updated` value for a cell that has never been processed. */
export const FRESH = 0xff;
/** Temperature of empty space; everything decays toward it. */
export const AMBIENT_TEMP = 20;

/** Movement kernel an element uses. Stored as a small integer for the hot loop. */
export const Behavior = {
  Static: 0,
  Liquid: 1,
  Powder: 2,
  Gas: 3,
} as const;
export type Behavior = (typeof Behavior)[keyof typeof Behavior];

/** What touching an element does to a living thing (see the entity layer). */
export const Hazard = {
  None: 0,
  Burns: 1,
  Corrodes: 2,
} as const;
export type Hazard = (typeof Hazard)[keyof typeof Hazard];

/** Structure-of-arrays cell storage. Only grid.ts helpers should write to it. */
export interface Grid {
  readonly width: number;
  readonly height: number;
  readonly size: number;
  /** Element id per cell, 0 = empty. */
  readonly id: Uint8Array;
  /** Heat 0..255. Empty cells hold 0 and are read as AMBIENT_TEMP. */
  readonly temp: Uint8Array;
  /** Element-specific counter (plant generation, gas lifetime, crust chill, ...). */
  readonly life: Uint8Array;
  /** Random byte assigned at creation; selects a palette variant. Travels with the cell. */
  readonly seed: Uint8Array;
  /** Tick-parity stamp (0 | 1) of the last tick this cell acted in, or FRESH. */
  readonly updated: Uint8Array;
}

/** Outcome of two elements touching. `aBecomes` applies to the cell being updated. */
export interface Reaction {
  aBecomes: number;
  bBecomes: number;
  /** Chance per contact per tick, 0..1. */
  probability: number;
  aLife?: number;
  bLife?: number;
  /** Chance 0..1 that side a / b actually converts once the row fires (default 1). */
  aChance?: number;
  bChance?: number;
}

export interface ReactionRule {
  a: number;
  b: number;
  reaction: Reaction;
  /** Also register the b→a direction (default true). */
  mirror?: boolean;
}

/** Temperature-driven phase changes. `above`: temp > threshold; `below`: temp < threshold. */
export interface Transitions {
  above?: readonly [temp: number, to: number];
  below?: readonly [temp: number, to: number];
}

/** API handed to element `update` hooks. Implemented by the Engine. */
export interface UpdateCtx {
  readonly grid: Grid;
  readonly width: number;
  readonly height: number;
  readonly registry: CompiledRegistry;
  readonly rng: Rng;
  /** Parity of the current tick; cells stamped with it will not act again this tick. */
  readonly parity: number;
  inBounds(x: number, y: number): boolean;
  /** Create a cell with the element's defaults and a fresh seed. */
  spawn(i: number, id: number, life?: number): void;
  /** Change a cell's element in place, keeping its seed. */
  transform(i: number, id: number, life?: number): void;
  clear(i: number): void;
  move(from: number, to: number): void;
  swap(a: number, b: number): void;
  stamp(i: number): void;
  /** Kill/knock entities within `r` of (cx, cy). Called by `blast()`. */
  blastEntities(cx: number, cy: number, r: number): void;
}

/** Return true when the hook fully handled the cell this tick (skips the movement kernel). */
export type UpdateFn = (ctx: UpdateCtx, x: number, y: number, i: number) => boolean;

/** Declarative description of an element. Everything the engine and renderer need. */
export interface ElementDef {
  /** Stable numeric id (never reorder ids — saves and tests depend on them). */
  id: number;
  name: string;
  /** Not shown in the palette (reaction products). */
  hidden?: boolean;
  /** One or more base colours; the renderer derives shaded variants. */
  colors: readonly string[];
  /** Optional gradient indexed by life / defaultLife (0 → first stop, 1 → last). */
  lifeColors?: readonly string[];
  behavior: Behavior;
  /** 0..255. Heavier sinks through lighter liquids/gases. */
  density: number;
  /** Liquids: max horizontal cells per tick. Gases: lateral drift range. */
  dispersion?: number;
  /** Liquids: chance 0..1 to skip lateral movement this tick. */
  viscosity?: number;
  /**
   * Powders: chance 0..1 to stay put instead of sliding diagonally when blocked below.
   * Slows slumping; the final rest angle is still 45°.
   */
  friction?: number;
  /** Gases: chance 0..1 to attempt an upward move each tick (default 1). */
  riseChance?: number;
  /**
   * Gases: expected temperature lost per tick toward AMBIENT_TEMP (default 0).
   * Values below 1 are applied probabilistically, which desynchronises lifetimes.
   */
  cooling?: number;
  /** Element a life countdown turns into when it reaches 0 (default EMPTY). */
  lifeEnd?: number;
  /**
   * Heat conduction 0..256. 0 means diffusion never writes this element's
   * temperature (heat sources, gases, empty). Neighbours still read it.
   */
  conductivity?: number;
  transitions?: Transitions;
  /** Effect on living things that touch this element (default none). */
  hazard?: 'burns' | 'corrodes';
  defaultTemp?: number;
  defaultLife?: number;
  update?: UpdateFn;
}

/** Registry compiled into flat typed arrays for the hot loop. */
export interface CompiledRegistry {
  readonly defs: ReadonlyArray<ElementDef | undefined>;
  readonly behavior: Uint8Array;
  readonly density: Uint8Array;
  readonly dispersion: Uint8Array;
  readonly viscosity: Float32Array;
  readonly friction: Float32Array;
  /** 1 - riseChance: probability a gas skips rising this tick. */
  readonly riseSkip: Float32Array;
  readonly cooling: Float32Array;
  readonly lifeEnd: Uint8Array;
  readonly conductivity: Uint16Array;
  readonly defaultTemp: Uint8Array;
  readonly defaultLife: Uint8Array;
  readonly hasUpdate: Uint8Array;
  readonly updateFns: ReadonlyArray<UpdateFn | undefined>;
  readonly hasTransition: Uint8Array;
  /** 255 when absent (temp > 255 is never true). */
  readonly transAboveTemp: Uint8Array;
  readonly transAboveTo: Uint8Array;
  /** 0 when absent (temp < 0 is never true). */
  readonly transBelowTemp: Uint8Array;
  readonly transBelowTo: Uint8Array;
  /** Hazard.* per element. */
  readonly hazard: Uint8Array;
  /** 1 when the element appears on the left side of any reaction row. */
  readonly reactive: Uint8Array;
  /** Indexed by a * MAX_ELEMENTS + b. */
  readonly reactions: ReadonlyArray<Reaction | undefined>;
}

/** Mutable counters the loop updates every frame; UI samples them at a low rate. */
export interface StatsSnapshot {
  fps: number;
  tickMs: number;
  renderMs: number;
  /** Non-empty cells. */
  particles: number;
  /** Cells that ran logic this tick. */
  active: number;
  awakeChunks: number;
  totalChunks: number;
  tick: number;
  /** Living humans in the entity layer. */
  people: number;
}

export function createStatsSnapshot(): StatsSnapshot {
  return { fps: 0, tickMs: 0, renderMs: 0, particles: 0, active: 0, awakeChunks: 0, totalChunks: 0, tick: 0, people: 0 };
}
