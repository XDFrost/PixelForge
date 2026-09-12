import type { ReactNode } from 'react';
import { SimulationContext, type SimulationHandle } from './EngineContext';

export interface SimulationProviderProps {
  readonly value: SimulationHandle;
  readonly children: ReactNode;
}

export function SimulationProvider({ value, children }: SimulationProviderProps) {
  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}
