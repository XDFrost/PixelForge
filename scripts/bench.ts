/**
 * Engine throughput benchmark. Run with `npm run bench`.
 *
 * Bundled with esbuild and executed by plain Node so the numbers reflect the
 * optimised engine, not test-runner module transforms (vitest is ~3x slower).
 *
 * Scene: 800x600 grid, lower 55% filled with water at 50% density, a lava band
 * above it, a plant strip along the floor. Nearly every cell is active.
 */
import { ElementId, registry } from '@/features/elements';
import { Engine } from '@/features/simulation/engine';
import { mulberry32 } from '@/shared/lib/rng';

const width = 800;
const height = 600;
const engine = new Engine({ width, height, registry, seed: 42 });
const rng = mulberry32(7);

/** `BENCH_SCENE=powder` replaces the lower part of the water band with sand to exercise the powder kernel. */
const scene = process.env.BENCH_SCENE ?? 'liquid';
const sandFrom = scene === 'powder' ? Math.floor(height * 0.8) : height;

for (let y = Math.floor(height * 0.45); y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (rng.next() < 0.5) engine.spawn(y * width + x, y >= sandFrom ? ElementId.Sand : ElementId.Water);
  }
}
for (let y = Math.floor(height * 0.3); y < Math.floor(height * 0.34); y++) {
  for (let x = 100; x < width - 100; x++) engine.spawn(y * width + x, ElementId.Lava);
}
for (let x = 0; x < width; x += 3) engine.spawn((height - 1) * width + x, ElementId.Plant);

for (let i = 0; i < 20; i++) engine.tick(); // warm-up

const ticks = 120;
const t0 = performance.now();
for (let i = 0; i < ticks; i++) engine.tick();
const msPerTick = (performance.now() - t0) / ticks;

console.log(
  `scene=${scene} grid=${width}x${height} particles=${engine.particles} active=${engine.active} ms/tick=${msPerTick.toFixed(2)} (${(1000 / msPerTick).toFixed(0)} ticks/s max)`,
);
