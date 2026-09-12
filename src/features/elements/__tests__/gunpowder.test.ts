import { describe, expect, it } from 'vitest';
import { ElementId } from '../ids';
import { count, fillRow, makeEngine, place, tickN } from './helpers';

const { Lava, Obsidian, Gunpowder, Fuse, Fire, Water, Sand } = ElementId;

describe('gunpowder', () => {
  it('a trail lit at one end fizzes along and is entirely consumed', () => {
    const e = makeEngine(32, 16, 5);
    fillRow(e, 15, Obsidian);
    for (let x = 6; x < 30; x++) place(e, x, 14, Gunpowder);
    place(e, 5, 14, Lava);
    let sawFuse = false;
    let sawFire = false;
    let consumedAt = -1;
    for (let t = 1; t <= 300; t++) {
      e.tick();
      if (count(e, Fuse) > 0) sawFuse = true;
      if (count(e, Fire) > 0) sawFire = true;
      if (count(e, Gunpowder) === 0 && count(e, Fuse) === 0) {
        consumedAt = t;
        break;
      }
    }
    expect(sawFuse).toBe(true);
    expect(sawFire).toBe(true);
    expect(consumedAt).toBeGreaterThan(0);
    expect(count(e, Obsidian)).toBe(32); // the floor is blast-proof
  });

  it('piles steeply and stays inert without an igniter', () => {
    const e = makeEngine(32, 32, 2);
    fillRow(e, 31, Obsidian);
    for (let y = 16; y <= 30; y++) place(e, 16, y, Gunpowder);
    tickN(e, 300);
    expect(count(e, Gunpowder)).toBe(15);
    expect(count(e, Fuse) + count(e, Fire)).toBe(0);
  });

  it('a blast flashes nearby water to steam and blows sand into smoke, sparing obsidian', () => {
    const e = makeEngine(32, 32, 11);
    fillRow(e, 31, Obsidian);
    for (let x = 10; x < 22; x++) place(e, x, 30, Sand);
    // Puddles either side of the charge; the charge itself rests on sand so it cannot sink away.
    for (let x = 10; x < 14; x++) place(e, x, 29, Water);
    for (let x = 19; x < 22; x++) place(e, x, 29, Water);
    place(e, 16, 29, Gunpowder);
    place(e, 16, 28, Lava);
    tickN(e, 30);
    expect(count(e, Sand)).toBeLessThan(12);
    expect(count(e, Water)).toBeLessThan(7);
    expect(count(e, Obsidian)).toBeGreaterThanOrEqual(32);
  });
});
