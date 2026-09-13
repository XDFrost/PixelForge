import { Bomb, Eraser, PersonStanding, Thermometer, type LucideIcon } from 'lucide-react';
import { HEAT_STOPS } from '@/features/sandbox/config';
import { useSandboxStore } from '@/features/sandbox/sandboxStore';
import { cn } from '@/shared/lib/utils';

export interface ToolsPanelProps {
  readonly label?: string;
}

interface ToolTileProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly title: string;
  readonly active: boolean;
  readonly onToggle: () => void;
}

function ToolTile({ icon: Icon, label, title, active, onToggle }: ToolTileProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title={title}
      className={cn(
        'flex h-10 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors',
        'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:border-muted-foreground/40 hover:bg-accent',
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function HeatLegend() {
  return (
    <div className="flex items-center gap-2" aria-label="Heat view legend">
      <span className="micro-label">Cold</span>
      <span
        aria-hidden
        className="h-1.5 flex-1 rounded-sm border border-border"
        style={{ background: `linear-gradient(90deg, ${HEAT_STOPS.join(', ')})` }}
      />
      <span className="micro-label">Hot</span>
    </div>
  );
}

export function ToolsPanel({ label = '03 / Tools' }: ToolsPanelProps) {
  const tool = useSandboxStore((s) => s.tool);
  const viewMode = useSandboxStore((s) => s.viewMode);
  const toggleEraser = useSandboxStore((s) => s.toggleEraser);
  const toggleTool = useSandboxStore((s) => s.toggleTool);
  const toggleHeatView = useSandboxStore((s) => s.toggleHeatView);
  const heat = viewMode === 'heat';

  return (
    <section aria-label="Tools" className="flex flex-col gap-3">
      <h2 className="micro-label">{label}</h2>
      <div className="grid grid-cols-2 gap-2">
        <ToolTile icon={Eraser} label="Eraser" title="Eraser (E)" active={tool === 'erase'} onToggle={toggleEraser} />
        <ToolTile icon={Thermometer} label="Heat view" title="Heat view (H)" active={heat} onToggle={toggleHeatView} />
        <ToolTile icon={Bomb} label="Bomb" title="Bomb (B)" active={tool === 'bomb'} onToggle={() => toggleTool('bomb')} />
        <ToolTile
          icon={PersonStanding}
          label="Humans"
          title="Humans (P)"
          active={tool === 'people'}
          onToggle={() => toggleTool('people')}
        />
      </div>
      {heat && <HeatLegend />}
    </section>
  );
}
