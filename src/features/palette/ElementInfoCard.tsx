import { elementById } from '@/features/elements';
import { useSandboxStore, type Tool } from '@/features/sandbox/sandboxStore';
import { describeElement } from './copy';

const TOOL_COPY: Readonly<Record<Exclude<Tool, 'draw'>, { title: string; body: string }>> = {
  erase: { title: 'Eraser', body: 'Removes whatever is under the brush, people included. Right-click does this too.' },
  bomb: {
    title: 'Bomb',
    body: 'Click to drop a bomb. It falls, fizzes for two seconds, then levels everything in reach. Stand well back.',
  },
  people: {
    title: 'Humans',
    body: 'Click or drag to place humans. They walk, climb steps, swim, and fear fire, acid, falling sand and bombs.',
  },
};

export function ElementInfoCard() {
  const selected = useSandboxStore((s) => s.selectedElement);
  const tool = useSandboxStore((s) => s.tool);
  const def = elementById(selected);

  const title = tool === 'draw' ? (def?.name ?? 'Nothing selected') : TOOL_COPY[tool].title;
  const body = tool === 'draw' ? describeElement(selected) : TOOL_COPY[tool].body;

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
