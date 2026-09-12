/** Seedable pseudo-random source used by the engine so simulations are reproducible in tests. */
export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [0, n). */
  nextInt(n: number): number;
  /** Uniform integer in [0, 255]. */
  nextByte(): number;
}

/** mulberry32 — tiny, fast, good enough distribution for a sandbox. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    nextInt: (n) => (next() * n) | 0,
    nextByte: () => (next() * 256) | 0,
  };
}

/** Non-deterministic seed for production use. */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
