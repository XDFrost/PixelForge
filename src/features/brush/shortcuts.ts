import { PALETTE_ELEMENTS } from '@/features/elements';
import type { EngineHandle } from '@/features/sandbox/EngineContext';
import { useSandboxStore } from '@/features/sandbox/sandboxStore';
import { useKeyboardShortcuts, type ShortcutMap } from '@/shared/hooks/useKeyboardShortcuts';

/** Human-readable list shown in the stats bar. */
export const SHORTCUT_HINTS: ReadonlyArray<{ keys: string; action: string }> = [
  { keys: 'DRAG', action: 'Draw' },
  { keys: 'RIGHT CLICK', action: 'Erase' },
  { keys: 'SPACE', action: 'Pause' },
  { keys: '[ ]', action: 'Brush' },
  { keys: 'H', action: 'Heat view' },
];

/** Binds the sandbox keyboard shortcuts for as long as the component is mounted. */
export function useSandboxShortcuts(engine: EngineHandle): void {
  const map: ShortcutMap = {
    ' ': () => useSandboxStore.getState().togglePaused(),
    '.': () => {
      const s = useSandboxStore.getState();
      if (!s.paused) s.setPaused(true);
      engine.requestStep();
    },
    '[': () => useSandboxStore.getState().adjustBrushSize(-2),
    ']': () => useSandboxStore.getState().adjustBrushSize(2),
    c: () => engine.clear(),
    C: () => engine.clear(),
    e: () => useSandboxStore.getState().toggleEraser(),
    E: () => useSandboxStore.getState().toggleEraser(),
    h: () => useSandboxStore.getState().toggleHeatView(),
    H: () => useSandboxStore.getState().toggleHeatView(),
  };
  PALETTE_ELEMENTS.forEach((def, i) => {
    if (i < 9) map[String(i + 1)] = () => useSandboxStore.getState().selectElement(def.id);
  });
  useKeyboardShortcuts(map);
}
