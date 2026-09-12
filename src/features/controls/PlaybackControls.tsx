import { Pause, Play, StepForward, Trash2 } from 'lucide-react';
import { useEngineHandle } from '@/features/sandbox/EngineContext';
import { useSandboxStore } from '@/features/sandbox/sandboxStore';
import { Button } from '@/shared/ui/button';
import { Kbd } from '@/shared/ui/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

export function PlaybackControls() {
  const paused = useSandboxStore((s) => s.paused);
  const togglePaused = useSandboxStore((s) => s.togglePaused);
  const setPaused = useSandboxStore((s) => s.setPaused);
  const engine = useEngineHandle();

  const step = (): void => {
    if (!paused) setPaused(true);
    engine.requestStep();
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Playback">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="default" onClick={togglePaused} aria-pressed={paused} className="min-w-24">
            {paused ? <Play /> : <Pause />}
            {paused ? 'Play' : 'Pause'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <Kbd>Space</Kbd>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="outline" onClick={step}>
            <StepForward />
            Step
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <Kbd>.</Kbd> one tick (pauses)
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="outline" onClick={() => engine.clear()}>
            <Trash2 />
            Clear
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <Kbd>C</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
