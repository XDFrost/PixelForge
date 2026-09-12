import { describe, expect, it } from 'vitest';
import { ElementId } from '../ids';
import { count, fillRow, makeEngine, place, positionsOf, tickN } from './helpers';

const { Water, Ember, Obsidian, Oil, BurningOil, Fire } = ElementId;

describe('oil', () => {
  it('floats on water', () => {
    const e = makeEngine(32, 32, 4);
    fillRow(e, 31, Obsidian);
    for (let y = 28; y <= 30; y++) fillRow(e, y, Water);
    place(e, 16, 20, Oil);
    tickN(e, 80);
    expect(count(e, Oil)).toBe(1);
    expect(count(e, Water)).toBe(96);
    const oilY = positionsOf(e, Oil)[0][1];
    const minWaterY = Math.min(...positionsOf(e, Water).map(([, y]) => y));
    expect(oilY).toBeLessThan(minWaterY);
  });

  it('a slick on water catches from an ember, burns across the surface and mostly burns off', () => {
    const e = makeEngine(32, 32, 9);
    fillRow(e, 31, Obsidian);
    for (let y = 29; y <= 30; y++) fillRow(e, y, Water);
    for (let x = 4; x < 28; x++) place(e, x, 28, Oil);
    // A glowing ember on an obsidian pillar: a static igniter level with the slick.
    place(e, 28, 29, Obsidian);
    place(e, 28, 30, Obsidian);
    place(e, 28, 28, Ember);
    const initialOil = 24;
    let sawBurning = false;
    let sawFire = false;
    for (let t = 0; t < 300; t++) {
      e.tick();
      if (count(e, BurningOil) > 0) sawBurning = true;
      if (count(e, Fire) > 0) sawFire = true;
      if (sawBurning && sawFire) break;
    }
    expect(sawBurning).toBe(true);
    expect(sawFire).toBe(true);
    tickN(e, 1500);
    expect(count(e, Oil) + count(e, BurningOil)).toBeLessThan(initialOil * 0.5);
  });
});
