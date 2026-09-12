import { createContext, useContext } from 'react';
import type { Command } from '@/features/simulation/commands';
import type { Engine } from '@/features/simulation/engine';
import type { StatsSnapshot } from '@/features/simulation/types';

/** Narrow, framework-agnostic surface that UI features may use. */
export interface EngineHandle {
  readonly width: number;
  readonly height: number;
  enqueue(cmd: Command): void;
  requestStep(): void;
  clear(): void;
}

/** Full handle used only inside the sandbox feature (canvas + loop wiring). */
export interface SimulationHandle {
  readonly engine: Engine;
  readonly stats: StatsSnapshot;
  readonly handle: EngineHandle;
}

/** Provided by <SimulationProvider> (see SimulationProvider.tsx). */
export const SimulationContext = createContext<SimulationHandle | null>(null);

export function useSimulation(): SimulationHandle {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used inside <SimulationProvider>');
  return ctx;
}

/** What controls, palette and stats use to talk to the engine. */
export function useEngineHandle(): EngineHandle {
  return useSimulation().handle;
}
