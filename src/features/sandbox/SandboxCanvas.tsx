import { useCallback, useEffect, useRef } from 'react';
import { usePointerPainting } from '@/features/brush/usePointerPainting';
import { registry } from '@/features/elements';
import { CanvasRenderer } from '@/features/renderer/CanvasRenderer';
import { buildHeatLut } from '@/features/renderer/heatLut';
import { buildPalette } from '@/features/renderer/palette';
import { startLoop } from '@/features/simulation/loop';
import { publishStats } from '@/features/stats/statsStore';
import { useElementSize } from '@/shared/hooks/useElementSize';
import { useSimulation } from './EngineContext';
import { BACKGROUND_HEX, HEAT_STOPS, MAX_CELL_CSS_PX, STATS_PUBLISH_MS } from './config';
import { useSandboxStore } from './sandboxStore';

/**
 * Owns the visible <canvas>: sizes it to an integer multiple of the grid,
 * runs the simulation loop, and wires pointer painting plus the brush cursor.
 */
export function SandboxCanvas() {
  const { engine, stats, handle } = useSimulation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const { width: cw, height: ch } = useElementSize(containerRef);
  const brushSize = useSandboxStore((s) => s.brushSize);
  const tool = useSandboxStore((s) => s.tool);
  // Bomb and people tools place fixed-size things, so the cursor shows their footprint.
  const cursorCells = tool === 'bomb' ? 5 : tool === 'people' ? 6 : brushSize;

  // Fill the container while keeping the 4:3 aspect; the backing store uses an integer
  // device-pixel scale so nearest-neighbour upscaling stays reasonably crisp.
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const fitCell = Math.min(cw / engine.width, ch / engine.height); // CSS px per cell that fits
  const cellCss = Math.max(0, Math.min(fitCell, MAX_CELL_CSS_PX));
  const scale = Math.max(1, Math.ceil(cellCss * dpr));
  const cssWidth = engine.width * cellCss;
  const cssHeight = engine.height * cellCss;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new CanvasRenderer(
      engine.width,
      engine.height,
      buildPalette(registry, BACKGROUND_HEX),
      registry,
      buildHeatLut(HEAT_STOPS, BACKGROUND_HEX),
    );
    const loop = startLoop({
      engine,
      stats,
      isPaused: () => useSandboxStore.getState().paused,
      render: () =>
        renderer.render(engine.grid, canvas, useSandboxStore.getState().viewMode, engine.entities, engine.tickCount),
    });
    const timer = window.setInterval(publishStats, STATS_PUBLISH_MS);
    return () => {
      loop.stop();
      window.clearInterval(timer);
    };
  }, [engine, stats]);

  const onHover = useCallback((pos: { x: number; y: number } | null) => {
    const el = cursorRef.current;
    if (!el) return;
    if (!pos) {
      el.style.opacity = '0';
      return;
    }
    el.style.opacity = '1';
    el.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
  }, []);

  const handlers = usePointerPainting({ canvasRef, engine: handle, onHover });

  return (
    <div ref={containerRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-background">
      <div className="relative" style={{ width: cssWidth, height: cssHeight }}>
        <canvas
          ref={canvasRef}
          width={engine.width * scale}
          height={engine.height * scale}
          className="pixelated block h-full w-full cursor-none touch-none select-none"
          aria-label="Simulation canvas"
          {...handlers}
        />
        <div
          ref={cursorRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 rounded-full border border-foreground/80 opacity-0 mix-blend-difference"
          style={{ width: Math.max(4, cursorCells * cellCss), height: Math.max(4, cursorCells * cellCss) }}
        />
      </div>
    </div>
  );
}
