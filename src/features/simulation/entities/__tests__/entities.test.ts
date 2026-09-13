import { describe, expect, it } from 'vitest';
import { applyCommand } from '../../commands';
import { Engine } from '../../engine';
import { compileRegistry } from '../../registry';
import { Behavior, EMPTY, MAX_ELEMENTS, type ElementDef } from '../../types';
import { BREATH_TICKS, BURN_TICKS, CORRODE_TICKS, SUFFOCATE_TICKS } from '../human';
import { BOMB_FUSE, HumanState, type EntityOptions } from '../types';

// Minimal element set: the engine layer must not import the real elements.
const EMPTY_DEF: ElementDef = { id: EMPTY, name: 'Empty', colors: ['#000'], behavior: Behavior.Static, density: 0 };
const WALL: ElementDef = { id: 1, name: 'Wall', colors: ['#888'], behavior: Behavior.Static, density: 255 };
const GRAIN: ElementDef = { id: 2, name: 'Grain', colors: ['#cb9'], behavior: Behavior.Powder, density: 150 };
const BRINE: ElementDef = { id: 3, name: 'Brine', colors: ['#48f'], behavior: Behavior.Liquid, density: 100 };
const FUME: ElementDef = { id: 4, name: 'Fume', colors: ['#555'], behavior: Behavior.Gas, density: 3, defaultLife: 40, lifeEnd: EMPTY };
const FLAME: ElementDef = {
  id: 5,
  name: 'Flame',
  colors: ['#f80'],
  behavior: Behavior.Gas,
  density: 1,
  defaultLife: 20,
  lifeEnd: EMPTY,
  defaultTemp: 255,
  hazard: 'burns',
};
const COALS: ElementDef = { id: 6, name: 'Coals', colors: ['#f40'], behavior: Behavior.Static, density: 255, defaultTemp: 255, hazard: 'burns' };
const VITRIOL: ElementDef = { id: 7, name: 'Vitriol', colors: ['#9f3'], behavior: Behavior.Liquid, density: 110, hazard: 'corrodes' };

const registry = compileRegistry([EMPTY_DEF, WALL, GRAIN, BRINE, FUME, FLAME, COALS, VITRIOL]);

const MASK = new Uint8Array(MAX_ELEMENTS).fill(1);
MASK[EMPTY] = 0;
const OPTS: EntityOptions = {
  fireId: FLAME.id,
  smokeId: FUME.id,
  bombRadius: 12,
  bombBlast: { fireId: FLAME.id, fireLife: 8, pFire: 0.5, destroyMask: MASK, debrisId: FUME.id, debrisLife: 20, pDestroy: 0.9, entityRadius: 14 },
};

const W = 48;
const H = 48;
const FLOOR = H - 1;

function makeEngine(seed = 1, opts: EntityOptions | undefined = OPTS): Engine {
  const e = new Engine({ width: W, height: H, registry, seed, entityOptions: opts });
  for (let x = 0; x < W; x++) e.spawn(FLOOR * W + x, WALL.id);
  return e;
}
const put = (e: Engine, x: number, y: number, id: number): void => e.spawn(y * W + x, id);
const rect = (e: Engine, x0: number, x1: number, y0: number, y1: number, id: number): void => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(e, x, y, id);
};
const countId = (e: Engine, id: number): number => {
  let n = 0;
  for (let i = 0; i < e.grid.size; i++) if (e.grid.id[i] === id) n++;
  return n;
};
const tickN = (e: Engine, n: number): void => {
  for (let i = 0; i < n; i++) e.tick();
};
const person = (e: Engine, x: number, y: number) => {
  const h = e.entities.spawnHuman(e, x, y);
  if (!h) throw new Error('no room');
  return h;
};
/** A person who stays put (idle for a very long time) so hazards can be aimed at them. */
const statue = (e: Engine, x: number, y: number) => {
  const h = person(e, x, y);
  h.state = HumanState.Idle;
  h.stateTicks = 1_000_000;
  return h;
};

describe('people', () => {
  it('fall to the ground and stand still', () => {
    const e = makeEngine();
    const h = person(e, 10, 10);
    tickN(e, 60);
    expect(h.alive).toBe(true);
    expect(h.y).toBe(FLOOR - 1);
    expect(h.state).not.toBe(HumanState.Fall);
    tickN(e, 30);
    expect(h.y).toBe(FLOOR - 1);
  });

  it('walk along the floor and turn around at walls', () => {
    const e = makeEngine(2);
    rect(e, 5, 5, FLOOR - 8, FLOOR - 1, WALL.id);
    rect(e, 20, 20, FLOOR - 8, FLOOR - 1, WALL.id);
    const h = person(e, 12, FLOOR - 1);
    let minX = h.x;
    let maxX = h.x;
    for (let t = 0; t < 900; t++) {
      e.tick();
      minX = Math.min(minX, h.x);
      maxX = Math.max(maxX, h.x);
    }
    expect(h.alive).toBe(true);
    expect(minX).toBeGreaterThanOrEqual(6);
    expect(maxX).toBeLessThanOrEqual(19);
    expect(minX).toBeLessThan(10);
    expect(maxX).toBeGreaterThan(14);
  });

  it('climb a one-cell step', () => {
    const e = makeEngine(3);
    rect(e, 20, W - 1, FLOOR - 1, FLOOR - 1, WALL.id); // raised platform on the right
    const h = person(e, 10, FLOOR - 1);
    h.dir = 1;
    let climbed = false;
    for (let t = 0; t < 900 && !climbed; t++) {
      e.tick();
      climbed = h.x >= 21 && h.y === FLOOR - 2;
    }
    expect(climbed).toBe(true);
  });

  it('hop over a narrow hole instead of falling in', () => {
    const e = makeEngine(4);
    const deck = FLOOR - 8;
    rect(e, 0, W - 1, deck, deck, WALL.id);
    e.clear(deck * W + 15); // a two-cell hole
    e.clear(deck * W + 16);
    const h = person(e, 8, deck - 1);
    h.dir = 1;
    let crossed = false;
    for (let t = 0; t < 600 && !crossed; t++) {
      e.tick();
      expect(h.y).toBeLessThanOrEqual(deck - 1);
      crossed = h.x >= 17;
    }
    expect(crossed).toBe(true);
  });

  it('drown in a sealed tank but tread water in an open pool', () => {
    const sealed = makeEngine(5);
    rect(sealed, 10, 10, 30, FLOOR - 1, WALL.id);
    rect(sealed, 20, 20, 30, FLOOR - 1, WALL.id);
    rect(sealed, 10, 20, 30, 30, WALL.id); // lid
    rect(sealed, 11, 19, 31, FLOOR - 1, BRINE.id);
    const trapped = person(sealed, 15, FLOOR - 1);
    tickN(sealed, BREATH_TICKS - 50);
    expect(trapped.alive).toBe(true);
    tickN(sealed, 80);
    expect(trapped.alive).toBe(false);

    const open = makeEngine(5);
    rect(open, 10, 10, 30, FLOOR - 1, WALL.id);
    rect(open, 20, 20, 30, FLOOR - 1, WALL.id);
    rect(open, 11, 19, 36, FLOOR - 1, BRINE.id);
    const swimmer = person(open, 15, FLOOR - 1);
    tickN(open, 600);
    expect(swimmer.alive).toBe(true);
    expect(swimmer.state).toBe(HumanState.Swim);
  });

  it('walk off a ledge into a pool and end up swimming, not standing on the water', () => {
    const e = makeEngine(16);
    const deck = FLOOR - 12;
    rect(e, 0, 20, deck, deck, WALL.id); // pier ending at x=20
    rect(e, 21, W - 1, FLOOR - 6, FLOOR - 1, BRINE.id); // pool beyond it
    const h = person(e, 14, deck - 1);
    h.dir = 1;
    let swam = false;
    for (let t = 0; t < 400 && !swam; t++) {
      e.tick();
      swam = h.state === HumanState.Swim;
    }
    expect(swam).toBe(true);
    expect(h.alive).toBe(true);
    expect(h.y).toBeGreaterThanOrEqual(FLOOR - 4); // chest in the brine, not perched on its surface
  });

  it('catch fire from hot coals, panic, and die leaving smoke', () => {
    const e = makeEngine(6);
    put(e, 11, FLOOR - 1, COALS.id);
    const h = person(e, 10, FLOOR - 1);
    e.tick();
    expect(h.state).toBe(HumanState.Burning);
    let sawSmoke = false;
    for (let t = 0; t < BURN_TICKS + 5; t++) {
      e.tick();
      if (countId(e, FUME.id) > 0) sawSmoke = true;
    }
    expect(h.alive).toBe(false);
    expect(sawSmoke).toBe(true);
  });

  it('dissolve when wading through a corrosive liquid', () => {
    const e = makeEngine(7);
    rect(e, 0, W - 1, FLOOR - 1, FLOOR - 1, VITRIOL.id); // ankle-deep everywhere
    const h = person(e, 10, FLOOR - 1);
    tickN(e, CORRODE_TICKS + 2);
    expect(h.alive).toBe(false);
  });

  it('ride a pile when only their legs are buried, suffocate when their head is', () => {
    const e = makeEngine(8);
    const rider = statue(e, 10, FLOOR - 1);
    tickN(e, 2);
    // Solid cells appear around their legs (a wall grew, or a pile settled): they climb on top.
    rect(e, rider.x, rider.x + 1, FLOOR - 2, FLOOR - 1, WALL.id);
    tickN(e, 6);
    expect(rider.alive).toBe(true);
    expect(rider.y).toBe(FLOOR - 3);

    // Loose grain slumps off them instead; they end up standing on what remains.
    const dusted = statue(e, 20, FLOOR - 1);
    tickN(e, 2);
    rect(e, dusted.x, dusted.x + 1, FLOOR - 2, FLOOR - 1, GRAIN.id);
    tickN(e, 10);
    expect(dusted.alive).toBe(true);
    expect(dusted.y).toBeLessThan(FLOOR - 1);

    const buried = statue(e, 30, FLOOR - 1);
    tickN(e, 2);
    put(e, buried.x, FLOOR - 5, WALL.id); // head row sealed in
    tickN(e, SUFFOCATE_TICKS + 2);
    expect(buried.alive).toBe(false);
  });

  it('are killed by a gunpowder-style blast but not beyond its reach', () => {
    const e = makeEngine(9);
    const near = statue(e, 24, FLOOR - 1);
    const far = statue(e, 2, FLOOR - 1);
    tickN(e, 2);
    e.blastEntities(20, FLOOR - 2, 6);
    e.tick();
    expect(near.alive).toBe(false);
    expect(far.alive).toBe(true);
  });
});

describe('bombs', () => {
  it('accelerate while falling but never tunnel through a floor', () => {
    const e = makeEngine(15);
    const b = e.entities.spawnBomb(e, 24, 4)!;
    let prevY = b.y;
    let maxStep = 0;
    for (let t = 0; t < 40; t++) {
      e.tick();
      maxStep = Math.max(maxStep, b.y - prevY);
      prevY = b.y;
    }
    expect(maxStep).toBeGreaterThan(1);
    expect(b.y).toBe(FLOOR - 1 - 2); // resting on the floor: bottom sprite row on FLOOR - 1
  });

  it('fall, wait out the fuse, then level the ground and kill nearby people', () => {
    const e = makeEngine(10);
    rect(e, 14, 34, FLOOR - 3, FLOOR - 1, WALL.id);
    const wallsBefore = countId(e, WALL.id);
    const bomb = e.entities.spawnBomb(e, 24, 20)!;
    const near = statue(e, 30, FLOOR - 4);
    const far = statue(e, 2, FLOOR - 1);
    tickN(e, BOMB_FUSE - 10);
    expect(bomb.alive).toBe(true);
    expect(bomb.y).toBe(FLOOR - 4 - 2); // resting on the block: sprite bottom row just above it
    expect(near.alive).toBe(true);
    tickN(e, 15);
    expect(e.entities.bombs.length).toBe(0);
    expect(near.alive).toBe(false);
    expect(far.alive).toBe(true);
    // Destruction falls off toward the rim, so only the core of the block is guaranteed to go.
    expect(countId(e, WALL.id)).toBeLessThan(wallsBefore - 30);
  });

  it('set off other bombs within reach on a later tick, never inline', () => {
    const e = makeEngine(11);
    const first = e.entities.spawnBomb(e, 24, FLOOR - 3)!;
    const second = e.entities.spawnBomb(e, 14, FLOOR - 3)!;
    second.fuse = 1000;
    first.fuse = 3;
    tickN(e, 3);
    expect(first.alive).toBe(false);
    expect(second.alive).toBe(true); // shortened fuse, but never in the same tick
    expect(second.fuse).toBeLessThanOrEqual(3);
    tickN(e, 5);
    expect(e.entities.bombs.length).toBe(0);
  });
});

describe('entity world housekeeping', () => {
  it('consumes no randomness while empty, so seeded runs stay identical', () => {
    const a = makeEngine(12);
    const b = makeEngine(12, undefined);
    rect(a, 10, 20, 10, 12, BRINE.id);
    rect(b, 10, 20, 10, 12, BRINE.id);
    tickN(a, 100);
    tickN(b, 100);
    expect(a.rng.next()).toBe(b.rng.next());
    expect(Array.from(a.grid.id)).toEqual(Array.from(b.grid.id));
  });

  it('the eraser removes people and clear removes everything', () => {
    const e = makeEngine(13);
    person(e, 10, FLOOR - 1);
    person(e, 11, FLOOR - 1);
    person(e, 30, FLOOR - 1);
    e.entities.spawnBomb(e, 40, 20);
    tickN(e, 2);
    applyCommand(e, { type: 'paint', element: 0, points: [10, FLOOR - 2], radius: 3, mode: 'erase', fill: 1 });
    expect(e.entities.humanCount).toBe(1);
    expect(e.entities.bombs.length).toBe(1);
    applyCommand(e, { type: 'clear' });
    expect(e.entities.count).toBe(0);
  });

  it('spawning into solid ground nudges upward and respects the cap', () => {
    const e = makeEngine(14);
    rect(e, 0, W - 1, FLOOR - 6, FLOOR - 1, WALL.id);
    const h = person(e, 10, FLOOR - 1);
    expect(h.y).toBe(FLOOR - 7);
    for (let i = 0; i < 600; i++) e.entities.spawnHuman(e, 10, 5);
    expect(e.entities.humanCount).toBeLessThanOrEqual(500);
  });
});
