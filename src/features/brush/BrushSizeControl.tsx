import { BRUSH_MAX, BRUSH_MIN } from '@/features/sandbox/config';
import { useSandboxStore } from '@/features/sandbox/sandboxStore';
import { Slider } from '@/shared/ui/slider';

export interface BrushSizeControlProps {
  readonly label?: string;
}

export function BrushSizeControl({ label = '02 / Brush size' }: BrushSizeControlProps) {
  const brushSize = useSandboxStore((s) => s.brushSize);
  const setBrushSize = useSandboxStore((s) => s.setBrushSize);

  return (
    <section aria-label="Brush size" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="micro-label">{label}</h2>
        <span className="font-mono text-xs tabular-nums text-foreground">{brushSize} px</span>
      </div>
      <Slider
        value={[brushSize]}
        min={BRUSH_MIN}
        max={BRUSH_MAX}
        step={1}
        onValueChange={([v]) => setBrushSize(v)}
        aria-label="Brush size"
      />
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{BRUSH_MIN} px</span>
        <span>{BRUSH_MAX} px</span>
      </div>
    </section>
  );
}
