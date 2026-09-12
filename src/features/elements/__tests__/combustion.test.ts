import { describe, expect, it } from 'vitest';
import { ElementId } from '../ids';
import { count, fillRow, makeEngine, place, tickN } from './helpers';

const { Water, Plant, Obsidian, Ember, Fire, Smoke } = ElementId;

describe('combustion', () => {
  it('a flame trapped against plant ignites it within 20 ticks', () => {
    const e = makeEngine(16, 16, 4);
    fillRow(e, 10, Obsidian);
    // Pocket: plant above and beside the flame so it cannot rise or drift away.
    for (const [x, y] of [
      [4, 9],
      [6, 9],
      [4, 8],
      [5, 8],
      [6, 8],
    ] as const) {
      place(e, x, y, Plant);
    }
    place(e, 5, 9, Fire);
    let ignited = false;
    for (let t = 0; t < 20 && !ignited; t++) {
      e.tick();
      ignited = count(e, Ember) > 0 || count(e, Plant) < 5;
    }
    expect(ignited).toBe(true);
  });

  it('an ember at one end of a plant row burns the whole row, smokes, then everything goes out', () => {
    const e = makeEngine(32, 16, 7);
    fillRow(e, 15, Obsidian);
    for (let x = 4; x < 28; x++) place(e, x, 14, Plant);
    place(e, 3, 14, Ember);
    let sawSmoke = false;
    let sawFire = false;
    let burnedOutAt = -1;
    for (let t = 1; t <= 1500; t++) {
      e.tick();
      if (count(e, Smoke) > 0) sawSmoke = true;
      if (count(e, Fire) > 0) sawFire = true;
      if (count(e, Plant) === 0) {
        burnedOutAt = t;
        break;
      }
    }
    expect(burnedOutAt).toBeGreaterThan(0);
    expect(sawSmoke).toBe(true);
    expect(sawFire).toBe(true);
    tickN(e, 450);
    expect(count(e, Fire) + count(e, Ember) + count(e, Smoke)).toBe(0);
  });

  it('water on both sides extinguishes a flame in one tick and survives', () => {
    const e = makeEngine(8, 8, 2);
    fillRow(e, 7, Obsidian);
    place(e, 3, 6, Water);
    place(e, 4, 6, Fire);
    place(e, 5, 6, Water);
    e.tick();
    expect(count(e, Fire)).toBe(0);
    expect(count(e, Water)).toBe(2);
  });

  it('an ember throws fire or smoke upward within 30 ticks', () => {
    const e = makeEngine(8, 8, 9);
    fillRow(e, 7, Obsidian);
    place(e, 4, 6, Ember);
    let emitted = false;
    for (let t = 0; t < 30 && !emitted; t++) {
      e.tick();
      emitted = count(e, Fire) + count(e, Smoke) > 0;
    }
    expect(emitted).toBe(true);
  });

  it('a spent ember leaves smoke, not a hole', () => {
    const e = makeEngine(8, 8, 1);
    fillRow(e, 7, Obsidian);
    place(e, 4, 6, Ember, 2);
    e.tick();
    e.tick();
    expect(count(e, Ember)).toBe(0);
    expect(count(e, Smoke)).toBeGreaterThan(0);
  });
});
