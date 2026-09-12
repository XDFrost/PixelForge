import { elementById } from '@/features/elements';
import { useSandboxStore } from '@/features/sandbox/sandboxStore';
import { describeElement } from './copy';

export function ElementInfoCard() {
  const selected = useSandboxStore((s) => s.selectedElement);
  const tool = useSandboxStore((s) => s.tool);
  const def = elementById(selected);

  const title = tool === 'erase' ? 'Eraser' : (def?.name ?? 'Nothing selected');
  const body = tool === 'erase' ? 'Removes whatever is under the brush. Right-click does this too.' : describeElement(selected);

  return (
    <div className="rounded-md border border-border bg-card px-3 py-3">
      <div className="flex items-center gap-2">
        {tool === 'draw' && def && (
          <span aria-hidden className="size-2 rounded-[2px]" style={{ backgroundColor: def.colors[0] }} />
        )}
        <h3 className="text-[13px] font-semibold text-primary">{title}</h3>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
