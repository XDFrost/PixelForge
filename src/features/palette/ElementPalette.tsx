import { PALETTE_ELEMENTS } from '@/features/elements';
import { useSandboxStore } from '@/features/sandbox/sandboxStore';
import { ElementSwatch } from './ElementSwatch';

export interface ElementPaletteProps {
  readonly label?: string;
}

export function ElementPalette({ label = '01 / Elements' }: ElementPaletteProps) {
  const selected = useSandboxStore((s) => s.selectedElement);
  const tool = useSandboxStore((s) => s.tool);
  const selectElement = useSandboxStore((s) => s.selectElement);

  return (
    <section aria-label="Elements" className="flex flex-col gap-3">
      <h2 className="micro-label">{label}</h2>
      <div className="grid grid-cols-2 gap-2">
        {PALETTE_ELEMENTS.map((def, i) => (
          <ElementSwatch
            key={def.id}
            element={def}
            selected={tool === 'draw' && def.id === selected}
            shortcut={i < 9 ? String(i + 1) : undefined}
            onSelect={selectElement}
          />
        ))}
      </div>
    </section>
  );
}
