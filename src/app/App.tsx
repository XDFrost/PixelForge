import { SandboxPage } from '@/features/sandbox/SandboxPage';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { AppShell } from './AppShell';

export function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <AppShell>
        <SandboxPage />
      </AppShell>
    </TooltipProvider>
  );
}
