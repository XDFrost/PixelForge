import { BOMB_HALF, HUMAN_HEIGHT, HUMAN_WIDTH, HumanState, type EntityWorld } from '@/features/simulation/entities';
import { IS_LITTLE_ENDIAN, packRgba, parseHex } from '@/shared/lib/color';

const pack = (hex: string): number => {
  const [r, g, b] = parseHex(hex);
  return packRgba(r, g, b, 255, IS_LITTLE_ENDIAN);
};

export const HUMAN_SKIN = pack('#f1c27d');
export const HUMAN_LEGS = pack('#23232b');
/** Shirt colour by `seed & 7`. */
export const HUMAN_SHIRTS: readonly number[] = ['#e84f4f', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f4f4f5'].map(pack);
// head, shirt, legs — two flicker frames
const BURN_A = [pack('#ffd27a'), pack('#ff9a2a'), pack('#ff7a1a')];
const BURN_B = [pack('#fff0a8'), pack('#ffb347'), pack('#d9481a')];
const HEAT_HUMAN = [pack('#ffffff'), pack('#f0f0ea'), pack('#d8d8d0')];

export const BOMB_BODY = pack('#1c1c22');
export const BOMB_HIGHLIGHT = pack('#6a6a78');
const BOMB_BODY_HEAT = pack('#4a4a52');
const BOMB_HIGHLIGHT_HEAT = pack('#7a7a84');
export const FUSE_RED = pack('#ff3b3b');
export const FUSE_YELLOW = pack('#ffd24a');

// 5×5: 0 skip, 1 body, 2 highlight, 3 fuse spark
const BOMB_SPRITE = [0, 0, 3, 0, 0, 0, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0] as const;

/**
 * Human sprite by row offset from the feet: rows 0-1 legs, 2-3 shirt, 4 head.
 * Index 0 = head palette entry, 1 = shirt, 2 = legs.
 */
const HUMAN_ROW_PART: readonly number[] = Array.from({ length: HUMAN_HEIGHT }, (_, r) => (r === HUMAN_HEIGHT - 1 ? 0 : r >= 2 ? 1 : 2));

function put(px: Uint32Array, width: number, height: number, x: number, y: number, color: number): void {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  px[y * width + x] = color;
}

/** Draw people and bombs over an already-filled pixel buffer. No-op when there are none. */
export function drawEntities(px: Uint32Array, width: number, height: number, world: EntityWorld, heat: boolean, tick: number): void {
  if (world.count === 0) return;

  for (const h of world.humans) {
    let parts: readonly number[];
    if (heat) parts = HEAT_HUMAN;
    else if (h.state === HumanState.Burning) parts = ((tick + h.seed) & 1) === 0 ? BURN_A : BURN_B;
    else parts = [HUMAN_SKIN, HUMAN_SHIRTS[h.seed & 7], HUMAN_LEGS];
    for (let r = 0; r < HUMAN_HEIGHT; r++) {
      const color = parts[HUMAN_ROW_PART[r]];
      for (let c = 0; c < HUMAN_WIDTH; c++) put(px, width, height, h.x + c, h.y - r, color);
    }
  }

  for (const b of world.bombs) {
    const body = heat ? BOMB_BODY_HEAT : BOMB_BODY;
    const hi = heat ? BOMB_HIGHLIGHT_HEAT : BOMB_HIGHLIGHT;
    // The spark blinks faster as the fuse runs down.
    const period = Math.max(1, b.fuse >> 4);
    const spark = (Math.floor(tick / period) & 1) === 0 ? FUSE_RED : FUSE_YELLOW;
    for (let k = 0; k < BOMB_SPRITE.length; k++) {
      const v = BOMB_SPRITE[k];
      if (v === 0) continue;
      const dx = (k % 5) - BOMB_HALF;
      const dy = Math.floor(k / 5) - BOMB_HALF;
      put(px, width, height, b.x + dx, b.y + dy, v === 1 ? body : v === 2 ? hi : spark);
    }
  }
}
