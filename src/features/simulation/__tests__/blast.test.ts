import { describe, expect, it } from 'vitest';
import { blast } from '../blast';
import { Engine } from '../engine';
import { compileRegistry } from '../registry';
import { Behavior, EMPTY, type ElementDef } from '../types';

// Minimal element set: the engine layer must not import the real elements.
const EMPTY_DEF: ElementDef = { id: EMPTY, name: 'Empty', colors: ['#000'], behavior: Behavior.Static, density: 0 };
const FLAME: ElementDef = { id: 1, name: 'Flame', colors: ['#f80'], behavior: Behavior.Gas, density: 1, defaultLife: 10, defaultTemp: 255 };
const WALL: ElementDef = { id: 2, name: 'Wall', colors: ['#888'], behavior: Behavior.Static, density: 255, defaultTemp: 20, conductivity: 32 };
const CRUMBLY: ElementDef = { id: 3, name: 'Crumbly', colors: ['#a86'], behavior: Behavior.Static, density: 255, defaultTemp: 20 };
const DUST: ElementDef = { id: 4, name: 'Dust', colors: ['#444'], behavior: Behavior.Gas, density: 2, defaultLife: 20 };

const registry = compileRegistry([EMPTY_DEF, FLAME, WALL, CRUMBLY, DUST]);

function makeEngine(): Engine {
  return new Engine({ width: 32, height: 32, registry, seed: 3 });
}

describe('blast', () => {
  it('ignites empty cells only within the radius', () => {
    const e = makeEngine();
    blast(e, 16, 16, 5, { fireId: FLAME.id, fireLife: 10, pFire: 1 });
    let inside = 0;
    for (let i = 0; i < e.grid.size; i++) {
      if (e.grid.id[i] !== FLAME.id) continue;
      const x = i % 32;
      const y = Math.floor(i / 32);
      const d2 = (x - 16) ** 2 + (y - 16) ** 2;
      expect(d2).toBeLessThanOrEqual(5.5 * 5.5);
      inside++;
    }
    expect(inside).toBeGreaterThan(40);
    // centre is certain to ignite (pFire 1 × (0.4 + 0.6))
    expect(e.grid.id[16 * 32 + 16]).toBe(FLAME.id);
  });

  it('heats non-empty cells in range to 255 and leaves cells outside untouched', () => {
    const e = makeEngine();
    for (let x = 0; x < 32; x++) e.spawn(20 * 32 + x, WALL.id);
    blast(e, 16, 16, 5, { fireId: FLAME.id, fireLife: 10, pFire: 0 });
    expect(e.grid.temp[20 * 32 + 16]).toBe(255); // 4 rows below the centre, in range
    expect(e.grid.temp[20 * 32 + 0]).toBe(20); // far left, out of range
    expect(e.grid.temp[20 * 32 + 31]).toBe(20);
  });

  it('pulverises masked cells into debris and spares unmasked ones', () => {
    const e = makeEngine();
    for (let x = 10; x < 23; x++) {
      e.spawn(16 * 32 + x, CRUMBLY.id);
      e.spawn(17 * 32 + x, WALL.id);
    }
    const mask = new Uint8Array(256);
    mask[CRUMBLY.id] = 1;
    blast(e, 16, 16, 6, {
      fireId: FLAME.id,
      fireLife: 10,
      pFire: 0,
      destroyMask: mask,
      debrisId: DUST.id,
      debrisLife: 5,
      pDestroy: 1,
    });
    expect(e.grid.id[16 * 32 + 16]).toBe(DUST.id); // centre crumbles for certain (falloff 1)
    let walls = 0;
    for (let x = 10; x < 23; x++) if (e.grid.id[17 * 32 + x] === WALL.id) walls++;
    expect(walls).toBe(13);
  });
});
