import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
  'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500',
  'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
  'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-green-500',
  'bg-lime-500', 'bg-yellow-500', 'bg-amber-500', 'bg-orange-500',
];

export function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center rounded-full text-white font-bold text-sm select-none shrink-0', avatarColor(name), className)}>
      {nameInitials(name)}
    </div>
  );
}
