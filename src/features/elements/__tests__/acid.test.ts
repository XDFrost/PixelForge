import { describe, expect, it } from 'vitest';
import { ElementId } from '../ids';
import { count, fillRow, makeEngine, place, tickN } from './helpers';

const { Obsidian, Stone, Acid, Water } = ElementId;

describe('acid', () => {
  it('dissolves stone and is spent doing so', () => {
    const e = makeEngine(16, 16, 6);
    fillRow(e, 15, Obsidian);
    for (let y = 12; y <= 14; y++) for (let x = 5; x <= 10; x++) place(e, x, y, Stone);
    for (let x = 5; x <= 10; x++) place(e, x, 11, Acid);
    tickN(e, 600);
    expect(count(e, Stone)).toBeLessThan(18);
    expect(count(e, Acid)).toBeLessThan(6);
    expect(count(e, Obsidian)).toBe(16);
  });

  it('is contained by an obsidian basin', () => {
    const e = makeEngine(16, 16, 2);
    fillRow(e, 15, Obsidian);
    for (let y = 10; y <= 14; y++) {
      place(e, 3, y, Obsidian);
      place(e, 12, y, Obsidian);
    }
    for (let y = 12; y <= 14; y++) for (let x = 4; x <= 11; x++) place(e, x, y, Acid);
    const obsidian = count(e, Obsidian);
    tickN(e, 500);
    expect(count(e, Obsidian)).toBe(obsidian);
    expect(count(e, Acid)).toBe(24);
  });

  it('dilutes away in water', () => {
    const e = makeEngine(16, 16, 4);
    fillRow(e, 15, Obsidian);
    for (let y = 11; y <= 14; y++) fillRow(e, y, Water);
    place(e, 8, 5, Acid);
    tickN(e, 600);
    expect(count(e, Acid)).toBe(0);
    expect(count(e, Water)).toBe(65);
  });
});
