import { describe, expect, it } from 'vitest';
import { clearCell, countNonEmpty, createGrid, idx, moveCell, setCell, swapCells } from '../grid';
import { FRESH } from '../types';

describe('grid', () => {
  it('creates zeroed arrays with FRESH stamps', () => {
    const g = createGrid(4, 3);
    expect(g.size).toBe(12);
    expect(countNonEmpty(g)).toBe(0);
    expect(g.updated.every((v) => v === FRESH)).toBe(true);
  });

  it('moveCell carries the full payload and empties the source', () => {
    const g = createGrid(4, 4);
    const a = idx(g, 1, 1);
    const b = idx(g, 1, 2);
    setCell(g, a, 7, 42, 200, 9);
    g.updated[a] = 1;
    moveCell(g, a, b);
    expect([g.id[b], g.seed[b], g.temp[b], g.life[b], g.updated[b]]).toEqual([7, 42, 200, 9, 1]);
    expect([g.id[a], g.seed[a], g.temp[a], g.life[a], g.updated[a]]).toEqual([0, 0, 0, 0, FRESH]);
  });

  it('swapCells exchanges every array', () => {
    const g = createGrid(2, 2);
    setCell(g, 0, 1, 10, 20, 30);
    setCell(g, 3, 2, 11, 21, 31);
    swapCells(g, 0, 3);
    expect([g.id[0], g.seed[0], g.temp[0], g.life[0]]).toEqual([2, 11, 21, 31]);
    expect([g.id[3], g.seed[3], g.temp[3], g.life[3]]).toEqual([1, 10, 20, 30]);
  });

  it('clearCell resets a cell', () => {
    const g = createGrid(2, 1);
    setCell(g, 1, 5, 5, 5, 5);
    clearCell(g, 1);
    expect(countNonEmpty(g)).toBe(0);
  });
});
