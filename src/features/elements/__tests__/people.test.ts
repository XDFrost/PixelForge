import { describe, expect, it } from 'vitest';
import { HumanState } from '@/features/simulation/entities';
import { ElementId } from '../ids';
import { count, fillRow, makeEngine, place, spawnHuman, tickN } from './helpers';

const { Lava, Obsidian, Acid, Wood, Smoke, BurningWood, Gunpowder, Fire } = ElementId;

describe('people and the real elements', () => {
  it('lava sets a person alight; they die leaving smoke', () => {
    const e = makeEngine(32, 32, 3);
    fillRow(e, 31, Obsidian);
    place(e, 11, 30, Lava);
    place(e, 11, 31, Obsidian); // keep the lava beside them, not below
    const h = spawnHuman(e, 10, 30);
    e.tick();
    expect(h.state).toBe(HumanState.Burning);
    let sawSmoke = false;
    for (let t = 0; t < 120 && h.alive; t++) {
      e.tick();
      if (count(e, Smoke) > 0) sawSmoke = true;
    }
    expect(h.alive).toBe(false);
    expect(sawSmoke).toBe(true);
  });

  it('acid dissolves a person', () => {
    const e = makeEngine(32, 32, 4);
    fillRow(e, 31, Obsidian);
    for (let x = 0; x < 32; x++) place(e, x, 30, Acid);
    const h = spawnHuman(e, 10, 29);
    tickN(e, 40);
    expect(h.alive).toBe(false);
  });

  it('a burning person sets wood alight as they run past', () => {
    const e = makeEngine(48, 32, 5);
    fillRow(e, 31, Obsidian);
    // A low wooden ceiling over the lane: the lava beside the runner sets them alight and
    // the flames they throw upward lick the beams.
    for (let x = 4; x <= 40; x++) place(e, x, 24, Wood);
    place(e, 9, 30, Lava);
    place(e, 9, 31, Obsidian);
    const h = spawnHuman(e, 10, 30);
    h.dir = 1;
    let woodCaught = false;
    for (let t = 0; t < 200 && !woodCaught; t++) {
      e.tick();
      woodCaught = count(e, BurningWood) > 0;
    }
    expect(woodCaught).toBe(true);
  });

  it('hot ground beside lava ignites a person standing on it', () => {
    const e = makeEngine(32, 32, 6);
    fillRow(e, 31, Obsidian);
    place(e, 8, 31, Lava); // heats the obsidian floor next to it
    const h = spawnHuman(e, 9, 30);
    let lit = false;
    for (let t = 0; t < 120 && !lit; t++) {
      e.tick();
      lit = h.state === HumanState.Burning;
    }
    expect(lit).toBe(true);
  });

  it('a gunpowder blast kills people within reach', () => {
    const e = makeEngine(48, 32, 7);
    fillRow(e, 31, Obsidian);
    for (let x = 20; x < 28; x++) place(e, x, 30, Gunpowder);
    const near = spawnHuman(e, 29, 30);
    const far = spawnHuman(e, 5, 30);
    tickN(e, 3);
    place(e, 19, 30, Fire);
    tickN(e, 40);
    expect(near.alive).toBe(false);
    expect(far.alive).toBe(true);
  });
});
