import type { BlastOptions } from '../blast';
import { EMPTY } from '../types';

export const HumanState = {
  Idle: 0,
  Walk: 1,
  Fall: 2,
  Swim: 3,
  Burning: 4,
  Dead: 5,
} as const;
export type HumanState = (typeof HumanState)[keyof typeof HumanState];

/**
 * A human: HUMAN_WIDTH cells wide, HUMAN_HEIGHT tall. `x,y` is the bottom-left
 * feet cell; the footprint spans x..x+W-1 and y-H+1..y (head row on top).
 */
export interface Human {
  x: number;
  y: number;
  dir: -1 | 1;
  state: HumanState;
  /** Idle countdown. */
  stateTicks: number;
  /** Cells fallen since last standing. */
  fallDist: number;
  /** Ticks with the head submerged. */
  breath: number;
  /** Burning countdown. */
  burn: number;
  /** Consecutive ticks in contact with a corrosive. */
  corrode: number;
  /** Consecutive ticks buried. */
  suffocate: number;
  /** Random byte: shirt colour, walk phase. */
  seed: number;
  alive: boolean;
}

/** A 5×5 bomb; `x,y` is the centre cell. */
export interface Bomb {
  x: number;
  y: number;
  /** Ticks until detonation. */
  fuse: number;
  /** Current fall speed in cells per tick (accelerates while airborne). */
  vy: number;
  sinkTicks: number;
  alive: boolean;
}

/** Terminal fall speed of a bomb, cells per tick. */
export const BOMB_MAX_FALL = 5;

/** Element ids and blast parameters the entity layer needs but cannot know; injected from the elements layer. */
export interface EntityOptions {
  /** Spawned above burning people. EMPTY disables. */
  fireId: number;
  /** Left behind when a person dies. EMPTY disables. */
  smokeId: number;
  bombRadius: number;
  bombBlast: BlastOptions;
}

/** Valid but inert defaults so an engine works without injected options (tests, bench). */
export const NO_ENTITY_OPTIONS: EntityOptions = {
  fireId: EMPTY,
  smokeId: EMPTY,
  bombRadius: 22,
  bombBlast: { fireId: EMPTY, fireLife: 0, pFire: 0 },
};

export const HUMAN_WIDTH = 2;
export const HUMAN_HEIGHT = 5;
/** Row offset (from the feet) of the chest: wet chest = swimming. */
export const HUMAN_CHEST = 2;
/** Bomb sprite half-size: footprint spans x-2..x+2, y-2..y+2. */
export const BOMB_HALF = 2;
export const MAX_HUMANS = 500;
export const MAX_BOMBS = 32;
/** Ticks from placement to detonation (2 s). */
export const BOMB_FUSE = 120;
