import { describe, expect, it } from 'vitest';
import { compileRegistry } from '@/features/simulation/registry';
import { AMBIENT_TEMP, Behavior } from '@/features/simulation/types';
import { empty } from '../defs/empty';
import { ElementId } from '../ids';
import { at, count, fillRow, makeEngine, place, tickN } from './helpers';

const { Water, Lava, Plant, Obsidian, Ember, Steam } = ElementId;

describe('temperature transitions', () => {
  it('water above 100° becomes steam', () => {
    const e = makeEngine();
    place(e, 5, 5, Water);
    e.grid.temp[5 * 16 + 5] = 101;
    e.tick();
    expect(count(e, Steam)).toBe(1);
    expect(count(e, Water)).toBe(0);
  });

  it('steam below 60° becomes water', () => {
    const e = makeEngine();
    place(e, 5, 5, Steam);
    e.grid.temp[5 * 16 + 5] = 59;
    e.tick();
    expect(count(e, Water)).toBe(1);
    expect(count(e, Steam)).toBe(0);
  });

  it('plant above 160° ignites', () => {
    const e = makeEngine();
    place(e, 5, 5, Plant);
    e.grid.temp[5 * 16 + 5] = 161;
    e.tick();
    expect(at(e, 5, 5)).toBe(Ember);
  });

  it('registry rejects a transition to an unknown element', () => {
    expect(() =>
      compileRegistry([
        empty,
        { id: 1, name: 'Bogus', colors: ['#fff'], behavior: Behavior.Static, density: 1, transitions: { above: [100, 200] } },
      ]),
    ).toThrow(/Unknown element id 200/);
  });
});

describe('heat diffusion', () => {
  it('a hot conductive cell warms its neighbours and cools itself', () => {
    const e = makeEngine();
    const W = 16;
    place(e, 4, 5, Obsidian);
    place(e, 5, 5, Obsidian);
    place(e, 6, 5, Obsidian);
    e.grid.temp[5 * W + 4] = AMBIENT_TEMP;
    e.grid.temp[5 * W + 5] = 255;
    e.grid.temp[5 * W + 6] = AMBIENT_TEMP;
    tickN(e, 2); // diffusion runs on even ticks
    expect(e.grid.temp[5 * W + 5]).toBeLessThan(255);
    expect(e.grid.temp[5 * W + 4]).toBeGreaterThan(AMBIENT_TEMP);
    expect(e.grid.temp[5 * W + 6]).toBeGreaterThan(AMBIENT_TEMP);
  });

  it('isolated hot obsidian decays to exactly ambient and stays there', () => {
    const e = makeEngine();
    place(e, 5, 5, Obsidian); // born at 200
    tickN(e, 400);
    expect(e.grid.temp[5 * 16 + 5]).toBe(AMBIENT_TEMP);
  });

  it('lava is a pinned heat source: deep lava stays at 255 under a water lake', () => {
    const e = makeEngine(32, 24, 5);
    for (let y = 12; y < 24; y++) for (let x = 0; x < 32; x++) place(e, x, y, Lava);
    for (let y = 6; y < 12; y++) for (let x = 0; x < 32; x++) place(e, x, y, Water);
    tickN(e, 200);
    expect(count(e, Lava)).toBeGreaterThan(0);
    for (let i = 0; i < e.grid.size; i++) {
      if (e.grid.id[i] === Lava) expect(e.grid.temp[i]).toBe(255);
    }
  });

  it('empty space is an ambient sink: a lone warm plant cools rather than heating the air', () => {
    const e = makeEngine();
    fillRow(e, 15, Obsidian);
    place(e, 5, 14, Plant);
    e.grid.temp[14 * 16 + 5] = 120;
    tickN(e, 100);
    expect(e.grid.temp[14 * 16 + 5]).toBeLessThan(40);
    expect(at(e, 5, 14)).toBe(Plant);
  });
});
