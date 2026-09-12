import { describe, expect, it } from 'vitest';
import type { Engine } from '@/features/simulation/engine';
import { ElementId } from '../ids';
import { at, fillRow, makeEngine, place } from './helpers';

const { Lava, Plant, Obsidian, Wood, BurningWood, Ember, Smoke } = ElementId;

/** Lava in a pocket of `fuel`; returns ticks until the cell above ignites, or -1. */
function igniteAbove(fuel: number, burning: number, seed: number): { engine: Engine; ignitedAt: number } {
  const e = makeEngine(16, 16, seed);
  fillRow(e, 10, Obsidian);
  for (const [x, y] of [
    [4, 9],
    [6, 9],
    [4, 8],
    [5, 8],
    [6, 8],
  ] as const) {
    place(e, x, y, fuel);
  }
  place(e, 5, 9, Lava);
  for (let t = 1; t <= 60; t++) {
    e.tick();
    if (at(e, 5, 8) === burning) return { engine: e, ignitedAt: t };
  }
  return { engine: e, ignitedAt: -1 };
}

describe('wood', () => {
  it('catches from lava and burns for a long time', () => {
    const { engine, ignitedAt } = igniteAbove(Wood, BurningWood, 3);
    expect(ignitedAt).toBeGreaterThan(0);
    for (let t = 0; t < 100; t++) engine.tick();
    expect(at(engine, 5, 8)).toBe(BurningWood);
  });

  it('plant in the same pocket is spent within 40 ticks of igniting', () => {
    const { engine, ignitedAt } = igniteAbove(Plant, Ember, 3);
    expect(ignitedAt).toBeGreaterThan(0);
    for (let t = 0; t < 40; t++) engine.tick();
    expect([0, Smoke]).toContain(at(engine, 5, 8));
  });
});
