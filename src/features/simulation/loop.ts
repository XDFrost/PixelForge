import type { Engine } from './engine';
import type { StatsSnapshot } from './types';

export interface LoopOptions {
  engine: Engine;
  /** Draw the current grid. Called every frame, paused or not. */
  render: () => void;
  isPaused: () => boolean;
  stats: StatsSnapshot;
  ticksPerSecond?: number;
  maxTicksPerFrame?: number;
  /** Injected for tests; defaults to window.requestAnimationFrame. */
  raf?: (cb: (t: number) => void) => number;
  caf?: (handle: number) => void;
  now?: () => number;
}

export interface LoopHandle {
  stop(): void;
}

const ema = (prev: number, next: number, alpha = 0.1): number => (prev === 0 ? next : prev + (next - prev) * alpha);

/**
 * Fixed-timestep simulation loop decoupled from the display refresh rate.
 * Commands always apply; ticks only run while unpaused (or on an explicit step).
 */
export function startLoop(opts: LoopOptions): LoopHandle {
  const {
    engine,
    render,
    isPaused,
    stats,
    ticksPerSecond = 60,
    maxTicksPerFrame = 4,
    raf = (cb) => window.requestAnimationFrame(cb),
    caf = (h) => window.cancelAnimationFrame(h),
    now = () => performance.now(),
  } = opts;

  const tickMs = 1000 / ticksPerSecond;
  let accumulator = 0;
  let last = now();
  let handle = 0;
  let stopped = false;

  const frame = (): void => {
    if (stopped) return;
    const t = now();
    const dt = Math.min(t - last, 250); // clamp after tab switches
    last = t;
    stats.fps = ema(stats.fps, 1000 / Math.max(dt, 0.001), 0.05);

    engine.applyPendingCommands();

    if (!isPaused()) {
      accumulator += dt;
      let n = 0;
      while (accumulator >= tickMs && n < maxTicksPerFrame) {
        const t0 = now();
        engine.tick();
        stats.tickMs = ema(stats.tickMs, now() - t0);
        accumulator -= tickMs;
        n++;
      }
      if (n === maxTicksPerFrame) accumulator = 0; // drop the backlog instead of spiralling
    } else {
      accumulator = 0;
      if (engine.consumeStepRequest()) {
        const t0 = now();
        engine.tick();
        stats.tickMs = ema(stats.tickMs, now() - t0);
      }
    }

    const r0 = now();
    render();
    stats.renderMs = ema(stats.renderMs, now() - r0);

    stats.particles = engine.particles;
    stats.active = engine.active;
    stats.tick = engine.tickCount;
    stats.people = engine.entities.humanCount;

    handle = raf(frame);
  };

  handle = raf(frame);

  return {
    stop() {
      stopped = true;
      caf(handle);
    },
  };
}
