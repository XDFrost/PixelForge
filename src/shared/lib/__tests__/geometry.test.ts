import { describe, expect, it } from 'vitest';
import { bresenham, circleOffsets } from '../geometry';

describe('bresenham', () => {
  it('produces an 8-connected line including both endpoints', () => {
    const pts: Array<[number, number]> = [];
    bresenham(0, 0, 100, 37, (x, y) => pts.push([x, y]));
    expect(pts[0]).toEqual([0, 0]);
    expect(pts[pts.length - 1]).toEqual([100, 37]);
    for (let i = 1; i < pts.length; i++) {
      expect(Math.abs(pts[i][0] - pts[i - 1][0])).toBeLessThanOrEqual(1);
      expect(Math.abs(pts[i][1] - pts[i - 1][1])).toBeLessThanOrEqual(1);
    }
    expect(pts.length).toBe(101);
  });

  it('handles reversed and vertical lines', () => {
    const pts: number[] = [];
    bresenham(3, 9, 3, 2, (_x, y) => pts.push(y));
    expect(pts).toEqual([9, 8, 7, 6, 5, 4, 3, 2]);
  });
});

describe('circleOffsets', () => {
  it('radius 0 is a single cell', () => {
    expect(Array.from(circleOffsets(0))).toEqual([0, 0]);
  });

  it('is symmetric and roughly pi r^2 in area', () => {
    const r = 6;
    const off = circleOffsets(r);
    const n = off.length / 2;
    expect(n).toBeGreaterThan(Math.PI * r * r * 0.85);
    expect(n).toBeLessThan(Math.PI * r * r * 1.25);
    const set = new Set<string>();
    for (let i = 0; i < off.length; i += 2) set.add(`${off[i]},${off[i + 1]}`);
    for (let i = 0; i < off.length; i += 2) expect(set.has(`${-off[i]},${-off[i + 1]}`)).toBe(true);
  });
});
