import { describe, expect, it } from 'vitest';
import { EntityWorld, HumanState } from '@/features/simulation/entities';
import { BOMB_BODY, BOMB_HIGHLIGHT, FUSE_RED, FUSE_YELLOW, HUMAN_LEGS, HUMAN_SHIRTS, HUMAN_SKIN, drawEntities } from '../entities';

const W = 16;
const H = 16;
const BG = 0x11223344;

function buffer(): Uint32Array {
  return new Uint32Array(W * H).fill(BG);
}

describe('drawEntities', () => {
  it('draws a person as a 2×5 figure: head, shirt and legs above the feet position', () => {
    const world = new EntityWorld();
    world.humans.push({
      x: 5,
      y: 10,
      dir: 1,
      state: HumanState.Walk,
      stateTicks: 0,
      fallDist: 0,
      breath: 0,
      burn: 0,
      corrode: 0,
      suffocate: 0,
      seed: 3,
      alive: true,
    });
    const px = buffer();
    drawEntities(px, W, H, world, false, 0);
    expect(px[6 * W + 5]).toBe(HUMAN_SKIN); // head row, left column
    expect(px[6 * W + 6]).toBe(HUMAN_SKIN); // head row, right column
    expect(px[7 * W + 5]).toBe(HUMAN_SHIRTS[3]);
    expect(px[8 * W + 6]).toBe(HUMAN_SHIRTS[3]);
    expect(px[9 * W + 5]).toBe(HUMAN_LEGS);
    expect(px[10 * W + 6]).toBe(HUMAN_LEGS);
    expect(px[11 * W + 5]).toBe(BG);
    expect(px[5 * W + 5]).toBe(BG);
    expect(px.filter((c) => c !== BG).length).toBe(10);
  });

  it('draws a bomb sprite with a blinking spark and never writes out of bounds', () => {
    const world = new EntityWorld();
    world.bombs.push({ x: 8, y: 8, fuse: 100, vy: 1, sinkTicks: 0, alive: true });
    const px = buffer();
    drawEntities(px, W, H, world, false, 0);
    expect(px[8 * W + 8]).toBe(BOMB_HIGHLIGHT);
    expect(px[9 * W + 8]).toBe(BOMB_BODY);
    expect([FUSE_RED, FUSE_YELLOW]).toContain(px[6 * W + 8]);
    expect(px.filter((c) => c !== BG).length).toBe(17); // 1 + 3 + 5 + 5 + 3

    const corner = new EntityWorld();
    corner.bombs.push({ x: 0, y: 0, fuse: 100, vy: 1, sinkTicks: 0, alive: true });
    const px2 = buffer();
    expect(() => drawEntities(px2, W, H, corner, false, 0)).not.toThrow();
    expect(px2[0]).toBe(BOMB_HIGHLIGHT);
    // Nothing wrapped around to the far side of the buffer.
    expect(px2[W - 1]).toBe(BG);
    expect(px2[2 * W - 1]).toBe(BG);
  });

  it('is a no-op for an empty world', () => {
    const px = buffer();
    drawEntities(px, W, H, new EntityWorld(), true, 5);
    expect(px.every((c) => c === BG)).toBe(true);
  });
});
