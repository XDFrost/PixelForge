import { describe, expect, it } from 'vitest';
import { ElementId } from '../ids';
import { count, fillRow, makeEngine, place, tickN } from './helpers';

const { Water, Lava, Obsidian, Ice } = ElementId;

describe('ice', () => {
  it('grows a bounded sheet into a lake without freezing it solid', () => {
    const e = makeEngine(32, 16, 8);
    fillRow(e, 15, Obsidian);
    for (let y = 8; y <= 14; y++) fillRow(e, y, Water);
    for (let y = 8; y <= 14; y++) {
      e.clear(y * 32);
      place(e, 0, y, Ice);
    }
    const initialWater = count(e, Water); // 7 rows × 31
    tickN(e, 600);
    expect(count(e, Ice)).toBeGreaterThan(7);
    expect(count(e, Water)).toBeGreaterThan(initialWater * 0.5);
    expect(count(e, Ice) + count(e, Water)).toBe(initialWater + 7);
  });

  it('melts beside lava', () => {
    const e = makeEngine(8, 8, 1);
    fillRow(e, 7, Obsidian);
    place(e, 4, 6, Ice);
    place(e, 5, 6, Lava);
    let melted = false;
    for (let t = 0; t < 60 && !melted; t++) {
      e.tick();
      melted = count(e, Ice) === 0;
    }
    expect(melted).toBe(true);
  });

  it('starts freezing cold and warms to ambient on its own', () => {
    const e = makeEngine();
    place(e, 5, 5, Ice);
    expect(e.grid.temp[5 * 16 + 5]).toBe(0);
    tickN(e, 200);
    expect(e.grid.temp[5 * 16 + 5]).toBe(20);
    expect(count(e, Ice)).toBe(1);
  });
});
