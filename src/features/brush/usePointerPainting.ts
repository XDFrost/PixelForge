import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { elementById } from '@/features/elements';
import type { EngineHandle } from '@/features/sandbox/EngineContext';
import { useSandboxStore } from '@/features/sandbox/sandboxStore';
import type { PaintMode } from '@/features/simulation/commands';
import { Behavior } from '@/features/simulation/types';
import { bresenham, clamp } from '@/shared/lib/geometry';

export interface PointerPaintingHandlers {
  onPointerDown: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerLeave: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
  onContextMenu: (e: ReactPointerEvent<HTMLCanvasElement> | React.MouseEvent) => void;
}

export interface PointerPaintingOptions {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly engine: EngineHandle;
  /** Called with the pointer's canvas-relative CSS position (or null when it leaves). */
  readonly onHover?: (pos: { x: number; y: number } | null) => void;
}

interface Stroke {
  pointerId: number;
  mode: PaintMode;
  element: number;
  radius: number;
  fill: number;
  lastX: number;
  lastY: number;
}

/** Brush radius in cells for a given brush size (diameter in cells). */
export const radiusForSize = (size: number): number => Math.max(0, Math.floor(size / 2));

/**
 * Turns pointer gestures on the canvas into PaintCommands.
 * Left button draws the selected element, right button / Alt erases,
 * Shift replaces whatever is under the brush. Fast drags are line-interpolated.
 */
export function usePointerPainting({ canvasRef, engine, onHover }: PointerPaintingOptions): PointerPaintingHandlers {
  const strokeRef = useRef<Stroke | null>(null);

  const toGrid = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0];
      const rect = canvas.getBoundingClientRect();
      const gx = Math.floor(((clientX - rect.left) / rect.width) * engine.width);
      const gy = Math.floor(((clientY - rect.top) / rect.height) * engine.height);
      return [clamp(gx, 0, engine.width - 1), clamp(gy, 0, engine.height - 1)];
    },
    [canvasRef, engine.width, engine.height],
  );

  const reportHover = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!onHover) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      onHover({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [canvasRef, onHover],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (e.button !== 0 && e.button !== 2) return;
      const { selectedElement, brushSize, tool } = useSandboxStore.getState();
      const erase = e.button === 2 || e.altKey || tool === 'erase';
      const mode: PaintMode = erase ? 'erase' : e.shiftKey ? 'replace' : 'draw';
      const def = elementById(selectedElement);
      const fill = def?.behavior === Behavior.Liquid || def?.behavior === Behavior.Powder ? 0.5 : 1;
      const [gx, gy] = toGrid(e.clientX, e.clientY);
      const stroke: Stroke = {
        pointerId: e.pointerId,
        mode,
        element: selectedElement,
        radius: radiusForSize(brushSize),
        fill,
        lastX: gx,
        lastY: gy,
      };
      strokeRef.current = stroke;
      e.currentTarget.setPointerCapture(e.pointerId);
      engine.enqueue({ type: 'paint', element: stroke.element, points: [gx, gy], radius: stroke.radius, mode, fill });
      reportHover(e);
    },
    [engine, toGrid, reportHover],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      reportHover(e);
      const stroke = strokeRef.current;
      if (!stroke || stroke.pointerId !== e.pointerId) return;

      const native = e.nativeEvent;
      const samples: Array<{ clientX: number; clientY: number }> =
        typeof native.getCoalescedEvents === 'function' && native.getCoalescedEvents().length > 0
          ? native.getCoalescedEvents()
          : [native];

      const points: number[] = [];
      for (const s of samples) {
        const [gx, gy] = toGrid(s.clientX, s.clientY);
        if (gx === stroke.lastX && gy === stroke.lastY) continue;
        bresenham(stroke.lastX, stroke.lastY, gx, gy, (x, y) => {
          if (x === stroke.lastX && y === stroke.lastY) return;
          points.push(x, y);
        });
        stroke.lastX = gx;
        stroke.lastY = gy;
      }
      if (points.length === 0) return;
      engine.enqueue({
        type: 'paint',
        element: stroke.element,
        points,
        radius: stroke.radius,
        mode: stroke.mode,
        fill: stroke.fill,
      });
    },
    [engine, toGrid, reportHover],
  );

  const endStroke = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const stroke = strokeRef.current;
      if (stroke && stroke.pointerId === e.pointerId) {
        strokeRef.current = null;
        const canvas = canvasRef.current;
        if (canvas?.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      }
    },
    [canvasRef],
  );

  // Safety net: if the up/cancel event never reaches the canvas (window blur,
  // capture lost mid-gesture), drop the stroke so later clicks are not swallowed.
  useEffect(() => {
    const abort = (): void => {
      const stroke = strokeRef.current;
      if (!stroke) return;
      strokeRef.current = null;
      const canvas = canvasRef.current;
      if (canvas?.hasPointerCapture(stroke.pointerId)) canvas.releasePointerCapture(stroke.pointerId);
    };
    window.addEventListener('pointerup', abort);
    window.addEventListener('pointercancel', abort);
    window.addEventListener('blur', abort);
    return () => {
      window.removeEventListener('pointerup', abort);
      window.removeEventListener('pointercancel', abort);
      window.removeEventListener('blur', abort);
    };
  }, [canvasRef]);

  const onPointerLeave = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!strokeRef.current) onHover?.(null);
      void e;
    },
    [onHover],
  );

  const onContextMenu = useCallback((e: { preventDefault(): void }) => e.preventDefault(), []);

  return { onPointerDown, onPointerMove, onPointerUp: endStroke, onPointerLeave, onContextMenu };
}
