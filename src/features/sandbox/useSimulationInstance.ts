import { useEffect, useState } from 'react';
import { registry } from '@/features/elements';
import { Engine } from '@/features/simulation/engine';
import { statsSnapshot } from '@/features/stats/statsStore';
import type { EngineHandle, SimulationHandle } from './EngineContext';
import { GRID_HEIGHT, GRID_WIDTH } from './config';

/** Creates the engine exactly once for the lifetime of the sandbox. */
export function useSimulationInstance(): SimulationHandle {
  const [sim] = useState<SimulationHandle>(() => {
    const engine = new Engine({ width: GRID_WIDTH, height: GRID_HEIGHT, registry });
    const handle: EngineHandle = {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      enqueue: (cmd) => engine.enqueue(cmd),
      requestStep: () => engine.requestStep(),
      clear: () => engine.enqueue({ type: 'clear' }),
    };
    return { engine, stats: statsSnapshot, handle };
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // Debug hook: inspect the live engine from the browser console.
    // Set in an effect so StrictMode's discarded initializer result is never exposed.
    (window as unknown as { __pixelforge?: SimulationHandle }).__pixelforge = sim;
  }, [sim]);

  return sim;
}
