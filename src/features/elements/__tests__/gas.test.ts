import { describe, expect, it } from 'vitest';
import { ElementId } from '../ids';
import { at, count, fillRow, makeEngine, place, positionsOf, tickN } from './helpers';

const { Water, Obsidian, Steam, Smoke } = ElementId;

describe('gas kernel', () => {
  it('steam rises at most one cell per tick and never sinks', () => {
    const e = makeEngine();
    place(e, 5, 12, Steam);
    let prevY = 12;
    for (let t = 0; t < 10; t++) {
      e.tick();
      const [[, y]] = positionsOf(e, Steam);
      expect(prevY - y).toBeGreaterThanOrEqual(0);
      expect(prevY - y).toBeLessThanOrEqual(1);
      prevY = y;
    }
    // riseChance 0.85 → about 8–9 rows in 10 ticks
    expect(prevY).toBeLessThanOrEqual(6);
    expect(count(e, Steam)).toBe(1);
  });

  it('a gas never moves down and never more than one row per tick', () => {
    const e = makeEngine(32, 32, 3);
    for (let x = 6; x < 26; x++) place(e, x, 28, Smoke);
    let prev = positionsOf(e, Smoke);
    for (let t = 0; t < 80; t++) {
      e.tick();
      const now = positionsOf(e, Smoke);
      expect(now.length).toBe(prev.length);
      for (const [x, y] of now) {
        const reachable = prev.some(([px, py]) => py - y >= 0 && py - y <= 1 && Math.abs(px - x) <= 2);
        expect(reachable).toBe(true);
      }
      prev = now;
    }
  });

  it('smoke with life 10 is alive after 9 ticks and gone after 10', () => {
    const e = makeEngine();
    place(e, 5, 12, Smoke, 10);
    tickN(e, 9);
    expect(count(e, Smoke)).toBe(1);
    e.tick();
    expect(count(e, Smoke)).toBe(0);
  });

  it('steam swaps up through a water column, preserving the water', () => {
    const e = makeEngine(16, 16, 2);
    fillRow(e, 15, Obsidian);
    for (let y = 8; y < 14; y++) place(e, 5, y, Water);
    place(e, 5, 14, Steam);
    tickN(e, 20);
    expect(count(e, Water)).toBe(6);
    expect(count(e, Steam)).toBe(1);
    const [[, steamY]] = positionsOf(e, Steam);
    const minWaterY = Math.min(...positionsOf(e, Water).map(([, y]) => y));
    expect(steamY).toBeLessThan(minWaterY);
  });

  it('water dropped onto smoke swaps places with it', () => {
    const e = makeEngine(8, 8, 1);
    fillRow(e, 7, Obsidian);
    place(e, 5, 5, Water);
    place(e, 5, 6, Smoke);
    e.tick();
    expect(at(e, 5, 5)).toBe(Smoke);
    expect(at(e, 5, 6)).toBe(Water);
  });

  it('steam trapped at the ceiling cools, condenses into one water cell and falls', () => {
    const e = makeEngine(8, 8, 5);
    place(e, 4, 4, Steam);
    let condensedAt = -1;
    for (let t = 1; t <= 800; t++) {
      e.tick();
      expect(count(e, Steam) + count(e, Water)).toBe(1);
      if (count(e, Water) === 1) {
        condensedAt = t;
        break;
      }
    }
    expect(condensedAt).toBeGreaterThan(0);
    tickN(e, 20);
    expect(count(e, Water)).toBe(1);
    expect(positionsOf(e, Water)[0][1]).toBe(7);
  });
});
