import type { ReactNode } from 'react';

export interface AppShellProps {
  readonly children: ReactNode;
}

function LogoMark() {
  // 4×4 pixel cluster in the accent colour.
  const cells = [1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1];
  return (
    <span aria-hidden className="grid size-6 grid-cols-4 gap-px">
      {cells.map((on, i) => (
        <span key={i} className={on ? 'bg-primary' : 'bg-transparent'} />
      ))}
    </span>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div className="flex flex-col">
            <span className="font-pixel text-base leading-none tracking-wide text-primary">PIXEL FORGE</span>
            <span className="micro-label mt-1">Matter. Motion. Possibility.</span>
          </div>
        </div>
        <span className="micro-label flex items-center gap-2">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          Cellular sandbox
        </span>
      </header>
      {children}
    </div>
  );
}
