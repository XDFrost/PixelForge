import type { ElementDef } from '@/features/simulation/types';
import { cn } from '@/shared/lib/utils';

export interface ElementSwatchProps {
  readonly element: ElementDef;
  readonly selected: boolean;
  readonly shortcut?: string;
  readonly onSelect: (id: number) => void;
}

export function ElementSwatch({ element, selected, shortcut, onSelect }: ElementSwatchProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(element.id)}
      aria-pressed={selected}
      title={shortcut ? `${element.name} (${shortcut})` : element.name}
      className={cn(
        'flex h-10 items-center gap-2.5 rounded-md border px-3 text-left text-[13px] font-medium transition-colors',
        'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:border-muted-foreground/40 hover:bg-accent',
      )}
    >
      <span
        aria-hidden
        className={cn('size-2.5 shrink-0 rounded-[2px]', selected && 'ring-1 ring-primary-foreground/40')}
        style={{ backgroundColor: element.colors[0] }}
      />
      <span className="truncate">{element.name}</span>
    </button>
  );
}
