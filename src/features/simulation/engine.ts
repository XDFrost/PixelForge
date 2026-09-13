import { mulberry32, randomSeed, type Rng } from '@/shared/lib/rng';
import { applyCommand, type Command } from './commands';
import { EntityWorld, type EntityOptions } from './entities';
import { clearCell, clearGrid, createGrid, moveCell, setCell, swapCells } from './grid';
import { updateGas } from './rules/gas';
import { HEAT_EVERY, diffuseHeat } from './rules/heat';
import { updateLiquid } from './rules/liquid';
import { updatePowder } from './rules/powder';
import { tryReactions } from './rules/reactions';
import { applyTransition } from './rules/transitions';
import { Behavior, EMPTY, type CompiledRegistry, type Grid, type UpdateCtx } from './types';

export interface EngineOptions {
  width: number;
  height: number;
  registry: CompiledRegistry;
  /** Seed for the internal PRNG. Fixed seeds make runs reproducible. */
  seed?: number;
  rng?: Rng;
  /** Element ids and blast parameters for people and bombs (injected from the elements layer). */
  entityOptions?: EntityOptions;
}

/**
 * The cellular-automata engine. Owns the grid and advances it one tick at a time.
 * Framework-free: no React, no DOM. All external mutation arrives as queued commands.
 */
export class Engine implements UpdateCtx {
  readonly grid: Grid;
  readonly width: number;
  readonly height: number;
  readonly registry: CompiledRegistry;
  readonly rng: Rng;
  /** People and bombs living on top of the grid. */
  readonly entities: EntityWorld;
  parity = 0;

  /** Number of ticks executed since creation / last clear. */
  tickCount = 0;
  /** Non-empty cells seen during the last tick. */
  particles = 0;
  /** Cells that ran logic during the last tick. */
  active = 0;

  private queue: Command[] = [];
  private stepRequested = false;
  /** Scratch buffer for the heat-diffusion pass. */
  private readonly scratch: Uint8Array;
  /** Row band that held non-empty cells during the last scan (inclusive). */
  private rowTop: number;
  private rowBottom: number;

  constructor(opts: EngineOptions) {
    this.width = opts.width;
    this.height = opts.height;
    this.grid = createGrid(opts.width, opts.height);
    this.registry = opts.registry;
    this.rng = opts.rng ?? mulberry32(opts.seed ?? randomSeed());
    this.entities = new EntityWorld(opts.entityOptions);
    this.scratch = new Uint8Array(this.grid.size);
    this.rowTop = this.height;
    this.rowBottom = -1;
  }

  // ---- UpdateCtx -----------------------------------------------------------

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  spawn(i: number, id: number, life?: number): void {
    const r = this.registry;
    setCell(this.grid, i, id, this.rng.nextByte(), r.defaultTemp[id], life ?? r.defaultLife[id]);
  }

  transform(i: number, id: number, life?: number): void {
    const g = this.grid;
    const r = this.registry;
    g.id[i] = id;
    g.temp[i] = r.defaultTemp[id];
    g.life[i] = life ?? r.defaultLife[id];
  }

  clear(i: number): void {
    clearCell(this.grid, i);
  }

  move(from: number, to: number): void {
    moveCell(this.grid, from, to);
  }

  swap(a: number, b: number): void {
    swapCells(this.grid, a, b);
  }

  stamp(i: number): void {
    this.grid.updated[i] = this.parity;
  }

  blastEntities(cx: number, cy: number, r: number): void {
    this.entities.applyBlast(cx, cy, r, this.rng);
  }

  // ---- Commands ------------------------------------------------------------

  spawnHuman(x: number, y: number): void {
    this.entities.spawnHuman(this, x, y);
  }

  spawnBomb(x: number, y: number): void {
    this.entities.spawnBomb(this, x, y);
  }

  eraseEntities(cx: number, cy: number, radius: number): void {
    this.entities.removeInCircle(cx, cy, radius);
  }

  enqueue(cmd: Command): void {
    this.queue.push(cmd);
  }

  /** Apply all queued commands. Call once per frame before ticking (also while paused). */
  applyPendingCommands(): boolean {
    if (this.queue.length === 0) return false;
    const cmds = this.queue;
    this.queue = [];
    for (const cmd of cmds) applyCommand(this, cmd);
    // Painted cells may lie outside last tick's band; widen so heat reaches them next pass.
    this.rowTop = 0;
    this.rowBottom = this.height - 1;
    return true;
  }

  clearAll(): void {
    clearGrid(this.grid);
    this.entities.clear();
    this.particles = 0;
    this.active = 0;
    this.rowTop = this.height;
    this.rowBottom = -1;
  }

  random(): number {
    return this.rng.next();
  }

  requestStep(): void {
    this.stepRequested = true;
  }

  consumeStepRequest(): boolean {
    const s = this.stepRequested;
    this.stepRequested = false;
    return s;
  }

  // ---- Tick ----------------------------------------------------------------

  /** Advance the simulation by one tick. */
  tick(): void {
    this.tickCount++;
    const tickNo = this.tickCount;
    const parity = tickNo & 1;
    this.parity = parity;

    const g = this.grid;
    const { width, height } = this;
    const ids = g.id;
    const updated = g.updated;
    const { behavior, hasUpdate, updateFns, hasTransition } = this.registry;

    if (tickNo % HEAT_EVERY === 0 && this.rowTop <= this.rowBottom) {
      const y0 = this.rowTop > 0 ? this.rowTop - 1 : 0;
      const y1 = this.rowBottom + 1 < height ? this.rowBottom + 1 : height - 1;
      diffuseHeat(g, this.registry, this.scratch, y0, y1);
    }

    let particles = 0;
    let active = 0;
    let top = height;
    let bottom = -1;

    for (let y = height - 1; y >= 0; y--) {
      const ltr = ((y + tickNo) & 1) === 0;
      const rowBase = y * width;
      let rowHas = false;
      for (let k = 0; k < width; k++) {
        const x = ltr ? k : width - 1 - k;
        const i = rowBase + x;
        const id = ids[i];
        if (id === EMPTY) continue;
        particles++;
        rowHas = true;
        if (updated[i] === parity) continue;
        const beh = behavior[id];
        const custom = hasUpdate[id] === 1;
        const trans = hasTransition[id] === 1;
        if (beh === Behavior.Static && !custom && !trans) continue;
        active++;

        if (tryReactions(this, x, y, i, id)) continue;

        if (trans && applyTransition(this, i, id)) {
          updated[i] = parity;
          continue;
        }

        if (custom) {
          const fn = updateFns[id]!;
          if (fn(this, x, y, i)) {
            if (ids[i] !== EMPTY) updated[i] = parity;
            continue;
          }
          if (ids[i] === EMPTY) continue; // hook removed the cell
        }

        switch (beh) {
          case Behavior.Liquid:
            updateLiquid(this, x, y, i, ids[i]);
            break;
          case Behavior.Gas:
            updateGas(this, x, y, i, ids[i]);
            break;
          case Behavior.Powder:
            updatePowder(this, x, y, i, ids[i]);
            break;
          default:
            updated[i] = parity;
        }
      }
      if (rowHas) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }

    this.particles = particles;
    this.active = active;
    this.rowTop = top;
    this.rowBottom = bottom;

    // Entities react to the settled grid. Early-outs when there are none.
    this.entities.tick(this, tickNo);
  }
}
