import { Engine } from '@/features/simulation/engine';
import { countOf } from '@/features/simulation/grid';
import { EMPTY } from '@/features/simulation/types';
import { registry } from '../index';

export function makeEngine(width = 16, height = 16, seed = 1): Engine {
  return new Engine({ width, height, registry, seed });
}

export function place(engine: Engine, x: number, y: number, id: number, life?: number): void {
  engine.spawn(y * engine.width + x, id, life);
}

export function at(engine: Engine, x: number, y: number): number {
  return engine.grid.id[y * engine.width + x];
}

export function tickN(engine: Engine, n: number): void {
  for (let i = 0; i < n; i++) engine.tick();
}

export function count(engine: Engine, id: number): number {
  return countOf(engine.grid, id);
}

export function nonEmpty(engine: Engine): number {
  let n = 0;
  for (let i = 0; i < engine.grid.size; i++) if (engine.grid.id[i] !== EMPTY) n++;
  return n;
}

/** Fill a full-width row with an element (a floor). */
export function fillRow(engine: Engine, y: number, id: number): void {
  for (let x = 0; x < engine.width; x++) place(engine, x, y, id);
}

/** Positions (x,y) of every cell holding `id`. */
export function positionsOf(engine: Engine, id: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const { width, size } = engine.grid;
  for (let i = 0; i < size; i++) {
    if (engine.grid.id[i] === id) out.push([i % width, Math.floor(i / width)]);
  }
  return out;
}
