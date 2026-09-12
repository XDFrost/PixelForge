import { circleOffsets } from '@/shared/lib/geometry';
import { EMPTY, type Grid } from './types';

export type PaintMode = 'draw' | 'erase' | 'replace';

export interface PaintCommand {
  type: 'paint';
  element: number;
  /** Flattened x,y pairs in grid coordinates (already line-interpolated). */
  points: ArrayLike<number>;
  /** Brush radius in cells (0 = single cell). */
  radius: number;
  mode: PaintMode;
  /** Fraction of brush cells actually filled, 0..1 (liquids pour more naturally at ~0.5). */
  fill: number;
}

export interface ClearCommand {
  type: 'clear';
}

export type Command = PaintCommand | ClearCommand;

export interface CommandTarget {
  readonly grid: Grid;
  spawn(i: number, id: number, life?: number): void;
  clear(i: number): void;
  clearAll(): void;
  random(): number;
}

export function applyCommand(target: CommandTarget, cmd: Command): void {
  if (cmd.type === 'clear') {
    target.clearAll();
    return;
  }
  const { grid } = target;
  const { width, height } = grid;
  const offsets = circleOffsets(cmd.radius);
  const pts = cmd.points;
  const partial = cmd.fill < 1;

  for (let p = 0; p + 1 < pts.length; p += 2) {
    const cx = pts[p];
    const cy = pts[p + 1];
    for (let k = 0; k < offsets.length; k += 2) {
      const x = cx + offsets[k];
      const y = cy + offsets[k + 1];
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const i = y * width + x;
      switch (cmd.mode) {
        case 'erase':
          if (grid.id[i] !== EMPTY) target.clear(i);
          break;
        case 'draw':
          if (grid.id[i] !== EMPTY) break;
          if (partial && target.random() >= cmd.fill) break;
          target.spawn(i, cmd.element);
          break;
        case 'replace':
          if (grid.id[i] === cmd.element) break;
          if (partial && grid.id[i] === EMPTY && target.random() >= cmd.fill) break;
          target.spawn(i, cmd.element);
          break;
      }
    }
  }
}
