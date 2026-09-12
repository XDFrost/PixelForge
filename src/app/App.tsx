import { SandboxPage } from '@/features/sandbox/SandboxPage';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { AppShell } from './AppShell';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export function App() {
  return (
    <>
      <TooltipProvider delayDuration={300}>
        <AppShell>
          <SandboxPage />
        </AppShell>
      </TooltipProvider>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
