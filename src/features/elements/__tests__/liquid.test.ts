import { describe, expect, it } from 'vitest';
import { ElementId } from '../ids';
import { at, count, fillRow, makeEngine, nonEmpty, place, positionsOf, tickN } from './helpers';

const { Water, Lava, Obsidian, Steam } = ElementId;

describe('liquid kernel', () => {
  it('water falls exactly one cell per tick', () => {
    const e = makeEngine();
    place(e, 5, 0, Water);
    e.tick();
    expect(at(e, 5, 0)).toBe(0);
    expect(at(e, 5, 1)).toBe(Water);
    expect(at(e, 5, 2)).toBe(0);
  });

  it('a stacked column falls as a block without gaps', () => {
    const e = makeEngine();
    for (let y = 0; y < 5; y++) place(e, 5, y, Water);
    e.tick();
    for (let y = 1; y <= 5; y++) expect(at(e, 5, y)).toBe(Water);
    expect(at(e, 5, 0)).toBe(0);
  });

  it('conserves mass and never teleports over many ticks', () => {
    const e = makeEngine(32, 32, 7);
    for (let y = 0; y < 10; y++) for (let x = 12; x < 20; x++) place(e, x, y, Water);
    const start = count(e, Water);
    let prev = positionsOf(e, Water);
    for (let t = 0; t < 200; t++) {
      e.tick();
      const now = positionsOf(e, Water);
      expect(now.length).toBe(start);
      // Every water cell must have a predecessor within reach (dy <= 1, dx <= dispersion).
      for (const [x, y] of now) {
        const reachable = prev.some(([px, py]) => Math.abs(px - x) <= 5 && y - py >= 0 && y - py <= 1);
        expect(reachable).toBe(true);
      }
      prev = now;
    }
  });

  it('water levels out into a thin layer', () => {
    const e = makeEngine(32, 16, 3);
    fillRow(e, 15, Obsidian);
    for (let y = 0; y < 20 && y < 14; y++) place(e, 16, y, Water);
    tickN(e, 120);
    const ys = positionsOf(e, Water).map(([, y]) => y);
    const minY = Math.min(...ys);
    expect(15 - minY).toBeLessThanOrEqual(2);
  });

  it('lava spreads less than water', () => {
    const spread = (id: number): number => {
      const e = makeEngine(48, 16, 5);
      fillRow(e, 15, Obsidian);
      for (let y = 4; y < 14; y++) place(e, 24, y, id);
      tickN(e, 60);
      const xs = positionsOf(e, id).map(([x]) => x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(spread(Lava)).toBeLessThan(spread(Water));
  });

  it('shows no left/right bias when water is dropped centrally', () => {
    const e = makeEngine(64, 40, 11);
    fillRow(e, 39, Obsidian);
    for (let y = 0; y < 20; y++) for (let x = 30; x < 34; x++) place(e, x, y, Water);
    tickN(e, 300);
    const xs = positionsOf(e, Water).map(([x]) => x);
    const left = xs.filter((x) => x < 32).length;
    const ratio = left / xs.length;
    expect(ratio).toBeGreaterThan(0.42);
    expect(ratio).toBeLessThan(0.58);
  });

  it('lava sinks through water and quenches at the interface, preserving mass', () => {
    const e = makeEngine(8, 8, 2);
    fillRow(e, 7, Obsidian);
    place(e, 4, 6, Water);
    place(e, 4, 5, Lava);
    const before = nonEmpty(e);
    e.tick();
    // Either lava swapped below water, or the pair reacted (obsidian + steam). Mass is preserved either way.
    const swapped = at(e, 4, 6) === Lava && at(e, 4, 5) === Water;
    const reacted = at(e, 4, 5) === Obsidian && at(e, 4, 6) === Steam;
    expect(swapped || reacted).toBe(true);
    expect(nonEmpty(e)).toBe(before);
  });
});
