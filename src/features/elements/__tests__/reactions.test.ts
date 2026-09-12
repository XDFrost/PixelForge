import { describe, expect, it } from 'vitest';
import { MAX_GENERATION } from '../defs/plant';
import { ElementId } from '../ids';
import { registry } from '../index';
import { at, count, fillRow, makeEngine, place, tickN } from './helpers';

const { Water, Lava, Plant, Obsidian, Ember, Steam } = ElementId;

describe('reactions', () => {
  it('lava beside water becomes obsidian and the water flashes to steam', () => {
    const e = makeEngine(8, 8, 1);
    fillRow(e, 7, Obsidian);
    place(e, 3, 6, Lava);
    place(e, 4, 6, Water);
    e.tick();
    expect(at(e, 3, 6)).toBe(Obsidian);
    expect(at(e, 4, 6)).toBe(Steam);
    tickN(e, 100);
    expect(at(e, 3, 6)).toBe(Obsidian);
  });

  it('lava adjacent to plant burns it to ember then to nothing; lava survives', () => {
    const e = makeEngine(8, 8, 4);
    fillRow(e, 7, Obsidian);
    place(e, 3, 6, Lava);
    place(e, 4, 6, Plant);
    let sawEmber = false;
    for (let t = 0; t < 60 && at(e, 4, 6) !== 0; t++) {
      e.tick();
      if (at(e, 4, 6) === Ember) sawEmber = true;
    }
    expect(sawEmber).toBe(true);
    expect(at(e, 4, 6)).toBe(0);
    expect(count(e, Lava)).toBe(1);
  });

  it('water on a lava pool builds an obsidian crust several cells deep, but not the whole pool', () => {
    const e = makeEngine(32, 24, 5);
    for (let y = 12; y < 24; y++) for (let x = 0; x < 32; x++) place(e, x, y, Lava);
    for (let y = 6; y < 12; y++) for (let x = 0; x < 32; x++) place(e, x, y, Water);
    const initialWater = count(e, Water);
    tickN(e, 400);
    const obsidian = count(e, Obsidian);
    expect(obsidian).toBeGreaterThan(32 * 2); // thicker than the single contact row
    expect(count(e, Lava)).toBeGreaterThan(32 * 4); // deep lava survives
    // Water is only ever converted to steam (which condenses back), never destroyed.
    expect(count(e, Water) + count(e, Steam)).toBeGreaterThanOrEqual(initialWater * 0.9);
    // The lake itself survives on top of the crust.
    expect(count(e, Water)).toBeGreaterThan(initialWater * 0.5);
  });

  it('keeps inert bulk materials out of the reaction scan', () => {
    const { Sand, Stone, Gunpowder, Acid, Fire } = ElementId;
    expect(registry.reactive[Sand]).toBe(0);
    expect(registry.reactive[Stone]).toBe(0);
    expect(registry.reactive[Gunpowder]).toBe(0);
    expect(registry.reactive[Acid]).toBe(1);
    expect(registry.reactive[Fire]).toBe(1);
    const N = 256;
    expect(registry.reactions[Acid * N + Stone]?.aChance).toBe(0.4);
    expect(registry.reactions[Stone * N + Acid]).toBeUndefined();
    expect(registry.friction[Gunpowder]).toBeCloseTo(0.3);
  });

  it('registry mirrors reactions so order of processing does not matter', () => {
    const N = 256;
    expect(registry.reactions[Lava * N + Water]?.aBecomes).toBe(Obsidian);
    expect(registry.reactions[Water * N + Lava]?.aBecomes).toBe(Steam);
    expect(registry.reactions[Water * N + Lava]?.bBecomes).toBe(Obsidian);
    expect(registry.reactions[Water * N + Lava]?.bLife).toBe(registry.reactions[Lava * N + Water]?.aLife);
    // ember→plant is intentionally one-directional
    expect(registry.reactions[Ember * N + Plant]).toBeDefined();
    expect(registry.reactions[Plant * N + Ember]).toBeUndefined();
  });
});

describe('plant', () => {
  it('grows into adjacent water within a few hundred ticks', () => {
    const e = makeEngine(8, 8, 9);
    fillRow(e, 7, Obsidian);
    place(e, 3, 6, Plant);
    place(e, 4, 6, Water);
    tickN(e, 400);
    // The water cell is absorbed (becomes plant); slow dry growth may add a few more.
    expect(count(e, Plant)).toBeGreaterThanOrEqual(2);
    expect(count(e, Water)).toBe(0);
    expect(at(e, 4, 6)).toBe(Plant);
  });

  it('never exceeds MAX_GENERATION even with unlimited water', () => {
    const e = makeEngine(24, 24, 13);
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) place(e, x, y, Water);
    // Replace the centre with a plant seed.
    e.clear(12 * 24 + 12);
    place(e, 12, 12, Plant);
    tickN(e, 3000);
    let maxGen = 0;
    for (let i = 0; i < e.grid.size; i++) {
      if (e.grid.id[i] === Plant) maxGen = Math.max(maxGen, e.grid.life[i]);
    }
    expect(maxGen).toBeLessThanOrEqual(MAX_GENERATION);
    expect(count(e, Plant)).toBeGreaterThan(20);
  });

  it('does not fall', () => {
    const e = makeEngine();
    place(e, 5, 2, Plant);
    tickN(e, 30);
    expect(at(e, 5, 2)).toBe(Plant);
  });
});
