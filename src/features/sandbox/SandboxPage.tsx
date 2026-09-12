import { BrushSizeControl } from '@/features/brush/BrushSizeControl';
import { useSandboxShortcuts } from '@/features/brush/shortcuts';
import { PlaybackControls } from '@/features/controls/PlaybackControls';
import { ToolsPanel } from '@/features/controls/ToolsPanel';
import { ElementInfoCard } from '@/features/palette/ElementInfoCard';
import { ElementPalette } from '@/features/palette/ElementPalette';
import { StatsBar } from '@/features/stats/StatsBar';
import { Separator } from '@/shared/ui/separator';
import { useEngineHandle } from './EngineContext';
import { SandboxCanvas } from './SandboxCanvas';
import { SimulationProvider } from './SimulationProvider';
import { GRID_HEIGHT, GRID_WIDTH } from './config';
import { useSimulationInstance } from './useSimulationInstance';

function Sidebar() {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-card/40 px-5 py-6">
      <ElementPalette />
      <Separator />
      <BrushSizeControl />
      <Separator />
      <ToolsPanel />
      <div className="mt-auto pt-2">
        <ElementInfoCard />
      </div>
    </aside>
  );
}

function ViewportFrame() {
  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="micro-label text-foreground/80">Experiment 001 / Free play</span>
          <span className="micro-label">
            {GRID_WIDTH} × {GRID_HEIGHT} / Light from above
          </span>
        </div>
        <PlaybackControls />
      </div>
      <SandboxCanvas />
      <StatsBar />
    </main>
  );
}

/** Mounts the keyboard shortcuts; must render inside the provider. */
function SandboxShortcuts() {
  useSandboxShortcuts(useEngineHandle());
  return null;
}

export function SandboxPage() {
  const sim = useSimulationInstance();
  return (
    <SimulationProvider value={sim}>
      <SandboxShortcuts />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <ViewportFrame />
      </div>
    </SimulationProvider>
  );
}
