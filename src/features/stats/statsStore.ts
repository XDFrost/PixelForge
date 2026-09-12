import { useSyncExternalStore } from 'react';
import { createStatsSnapshot, type StatsSnapshot } from '@/features/simulation/types';

/**
 * The single mutable snapshot the simulation loop writes into every frame.
 * React only re-renders when `publishStats()` bumps the version (a few Hz).
 */
export const statsSnapshot: StatsSnapshot = createStatsSnapshot();

let version = 0;
const listeners = new Set<() => void>();

export function publishStats(): void {
  version++;
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getVersion = (): number => version;

/** Read the latest published stats. Re-renders only on publish. */
export function useStats(): Readonly<StatsSnapshot> {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return statsSnapshot;
}
