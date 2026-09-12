import { describe, expect, it } from 'vitest';
import { ElementId } from '../ids';
import { at, count, fillRow, makeEngine, place, positionsOf, tickN } from './helpers';

const { Water, Obsidian, Smoke, Sand } = ElementId;

describe('powder kernel', () => {
  it('a sand column slumps into a wider, lower pile without losing grains', () => {
    const e = makeEngine(32, 32, 3);
    fillRow(e, 31, Obsidian);
    for (let y = 11; y <= 30; y++) place(e, 16, y, Sand);
    tickN(e, 200);
    expect(count(e, Sand)).toBe(20);
    const pos = positionsOf(e, Sand);
    const minY = Math.min(...pos.map(([, y]) => y));
    const xs = pos.map(([x]) => x);
    expect(31 - minY).toBeLessThan(20);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(1);
  });

  it('a one-cell-thick sand layer on a floor never moves', () => {
    const e = makeEngine(32, 32, 5);
    fillRow(e, 31, Obsidian);
    fillRow(e, 30, Sand);
    tickN(e, 50);
    expect(positionsOf(e, Sand).every(([, y]) => y === 30)).toBe(true);
    expect(count(e, Sand)).toBe(32);
  });

  it('sand sinks through water to the floor and the water is preserved', () => {
    const e = makeEngine(32, 32, 7);
    fillRow(e, 31, Obsidian);
    for (let y = 28; y <= 30; y++) fillRow(e, y, Water);
    place(e, 16, 20, Sand);
    tickN(e, 60);
    expect(count(e, Sand)).toBe(1);
    expect(count(e, Water)).toBe(96);
    expect(positionsOf(e, Sand)[0][1]).toBe(30);
  });

  it('sand falling onto smoke swaps places with it', () => {
    const e = makeEngine(8, 8, 1);
    fillRow(e, 7, Obsidian);
    place(e, 5, 5, Sand);
    place(e, 5, 6, Smoke);
    e.tick();
    expect(at(e, 5, 6)).toBe(Sand);
    expect(at(e, 5, 5)).toBe(Smoke);
  });

  it('water does not sink into sand', () => {
    const e = makeEngine(16, 16, 2);
    fillRow(e, 15, Obsidian);
    for (let y = 12; y <= 14; y++) fillRow(e, y, Sand);
    place(e, 8, 5, Water);
    tickN(e, 40);
    expect(positionsOf(e, Water)[0][1]).toBe(11);
    expect(count(e, Sand)).toBe(48);
  });
});
