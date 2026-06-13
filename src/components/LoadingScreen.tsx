import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

/** Full-screen branded loader shown during page refresh / route loading. */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-8 bg-background">
      <Logo imgClassName="h-16 md:h-20 animate-pulse" />
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium tracking-wide">Loading…</span>
      </div>
    </div>
  );
}
