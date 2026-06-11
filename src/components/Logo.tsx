import { cn } from '@/lib/utils';
import logoUrl from '../../assets/logo/Fly_together_logo_trimmed.png';

interface LogoProps {
  /** Tailwind sizing/extra classes for the <img> (e.g. "h-14 md:h-16"). */
  imgClassName?: string;
  /** Wrap the logo in a white pill so the navy wordmark stays legible on dark backgrounds. */
  onDark?: boolean;
  className?: string;
}

/**
 * The "Let's Fly Together — Careerwise Education Ltd." brand mark.
 * Renders the official logo image. Drop it inside an existing <Link> for navigation.
 */
export function Logo({ imgClassName, onDark = false, className }: LogoProps) {
  const img = (
    <img
      src={logoUrl}
      alt="Let's Fly Together — Careerwise Education Ltd."
      className={cn('w-auto object-contain select-none', imgClassName)}
      draggable={false}
    />
  );

  if (onDark) {
    return (
      <span className={cn('inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-sm', className)}>
        {img}
      </span>
    );
  }

  return <span className={cn('inline-flex items-center', className)}>{img}</span>;
}
