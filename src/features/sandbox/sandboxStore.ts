import { create } from 'zustand';
import { ElementId } from '@/features/elements';
import type { ViewMode } from '@/features/renderer/CanvasRenderer';
import { clamp } from '@/shared/lib/geometry';
import { BRUSH_DEFAULT, BRUSH_MAX, BRUSH_MIN } from './config';

export type Tool = 'draw' | 'erase';
export type { ViewMode };

export interface SandboxState {
  selectedElement: number;
  brushSize: number;
  paused: boolean;
  tool: Tool;
  viewMode: ViewMode;

  selectElement: (id: number) => void;
  setBrushSize: (size: number) => void;
  adjustBrushSize: (delta: number) => void;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setTool: (tool: Tool) => void;
  toggleEraser: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleHeatView: () => void;
}

/**
 * UI state for the sandbox. React components subscribe with selectors; the
 * simulation loop reads it synchronously via `useSandboxStore.getState()`.
 */
export const useSandboxStore = create<SandboxState>((set) => ({
  selectedElement: ElementId.Water,
  brushSize: BRUSH_DEFAULT,
  paused: false,
  tool: 'draw',
  viewMode: 'normal',

  selectElement: (id) => set({ selectedElement: id, tool: 'draw' }),
  setBrushSize: (size) => set({ brushSize: clamp(Math.round(size), BRUSH_MIN, BRUSH_MAX) }),
  adjustBrushSize: (delta) => set((s) => ({ brushSize: clamp(s.brushSize + delta, BRUSH_MIN, BRUSH_MAX) })),
  setPaused: (paused) => set({ paused }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setTool: (tool) => set({ tool }),
  toggleEraser: () => set((s) => ({ tool: s.tool === 'erase' ? 'draw' : 'erase' })),
  setViewMode: (viewMode) => set({ viewMode }),
  toggleHeatView: () => set((s) => ({ viewMode: s.viewMode === 'heat' ? 'normal' : 'heat' })),
}));
