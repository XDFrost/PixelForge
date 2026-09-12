import { EMPTY, FRESH, type Grid } from './types';

export function createGrid(width: number, height: number): Grid {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid grid size ${width}x${height}`);
  }
  const size = width * height;
  return {
    width,
    height,
    size,
    id: new Uint8Array(size),
    temp: new Uint8Array(size),
    life: new Uint8Array(size),
    seed: new Uint8Array(size),
    updated: new Uint8Array(size).fill(FRESH),
  };
}

export const idx = (g: Grid, x: number, y: number): number => y * g.width + x;

/** Write a complete cell. This and the helpers below are the only grid writers. */
export function setCell(g: Grid, i: number, id: number, seed: number, temp: number, life: number): void {
  g.id[i] = id;
  g.seed[i] = seed;
  g.temp[i] = temp;
  g.life[i] = life;
  g.updated[i] = FRESH;
}

export function clearCell(g: Grid, i: number): void {
  g.id[i] = EMPTY;
  g.seed[i] = 0;
  g.temp[i] = 0;
  g.life[i] = 0;
  g.updated[i] = FRESH;
}

/** Move the whole payload from → to (to must be empty), leaving `from` empty. */
export function moveCell(g: Grid, from: number, to: number): void {
  g.id[to] = g.id[from];
  g.seed[to] = g.seed[from];
  g.temp[to] = g.temp[from];
  g.life[to] = g.life[from];
  g.updated[to] = g.updated[from];
  clearCell(g, from);
}

export function swapCells(g: Grid, a: number, b: number): void {
  let t = g.id[a];
  g.id[a] = g.id[b];
  g.id[b] = t;
  t = g.seed[a];
  g.seed[a] = g.seed[b];
  g.seed[b] = t;
  t = g.temp[a];
  g.temp[a] = g.temp[b];
  g.temp[b] = t;
  t = g.life[a];
  g.life[a] = g.life[b];
  g.life[b] = t;
  t = g.updated[a];
  g.updated[a] = g.updated[b];
  g.updated[b] = t;
}

export function clearGrid(g: Grid): void {
  g.id.fill(EMPTY);
  g.temp.fill(0);
  g.life.fill(0);
  g.seed.fill(0);
  g.updated.fill(FRESH);
}

export function countNonEmpty(g: Grid): number {
  let n = 0;
  const id = g.id;
  for (let i = 0; i < g.size; i++) if (id[i] !== EMPTY) n++;
  return n;
}

export function countOf(g: Grid, elementId: number): number {
  let n = 0;
  const id = g.id;
  for (let i = 0; i < g.size; i++) if (id[i] === elementId) n++;
  return n;
}
