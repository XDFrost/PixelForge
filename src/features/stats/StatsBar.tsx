import { SHORTCUT_HINTS } from '@/features/brush/shortcuts';
import { Kbd } from '@/shared/ui/kbd';
import { useStats } from './statsStore';

const fmtInt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function Stat({ value, unit }: { readonly value: string; readonly unit: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-foreground">{value}</span> <span className="text-muted-foreground">{unit}</span>
    </span>
  );
}

export function StatsBar() {
  const s = useStats();
  return (
    <footer className="micro-label flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-2.5 normal-case tracking-[0.12em]">
      <Stat value={fmtInt.format(Math.round(s.fps))} unit="FPS" />
      <Stat value={fmtInt.format(s.particles)} unit="PARTICLES" />
      <Stat value={s.tickMs.toFixed(1)} unit="MS / TICK" />
      <Stat value={fmtInt.format(s.active)} unit="ACTIVE" />

      <span className="ml-auto hidden items-center gap-4 lg:flex">
        {SHORTCUT_HINTS.map((h) => (
          <span key={h.keys} className="flex items-center gap-1.5">
            <Kbd className="h-4 rounded-[3px] border border-border bg-transparent px-1 font-mono text-[9px] tracking-wider text-muted-foreground">
              {h.keys}
            </Kbd>
            <span className="text-foreground/80">{h.action}</span>
          </span>
        ))}
      </span>
    </footer>
  );
}
