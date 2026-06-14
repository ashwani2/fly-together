import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

/**
 * Branded inline loader — the Fly Together logo with a spinner. Use anywhere
 * we're waiting on a backend fetch (tables, lists, dialogs) so the wait stays
 * on-brand instead of a bare spinner.
 */
export function BrandedLoader({
  label = 'Loading…',
  className,
  logoClassName = 'h-10',
}: {
  label?: string;
  className?: string;
  logoClassName?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-10', className)}>
      <Logo imgClassName={cn(logoClassName, 'animate-pulse')} />
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium tracking-wide">{label}</span>
      </div>
    </div>
  );
}
