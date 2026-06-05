import { forwardRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone =
  | 'brand'
  | 'accent'
  | 'fuchsia'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

type Size = 'sm' | 'md';

interface TagProps {
  tone?: Tone;
  size?: Size;
  removable?: boolean;
  onRemove?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Add a soft pulsing dot on the left. */
  pulse?: boolean;
}

const TONE_MAP: Record<Tone, string> = {
  brand: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
  accent: 'bg-accent-500/10 text-accent-400 border-accent-500/30',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  info: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  neutral: 'bg-slate-500/10 text-slate-300 border-slate-500/30'
};

const TONE_DOT: Record<Tone, string> = {
  brand: 'bg-brand-400',
  accent: 'bg-accent-400',
  fuchsia: 'bg-fuchsia-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  info: 'bg-sky-400',
  neutral: 'bg-slate-400'
};

const SIZE_MAP: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs'
};

export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { tone = 'neutral', size = 'md', removable, onRemove, icon, children, pulse, className },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        TONE_MAP[tone],
        SIZE_MAP[size],
        className
      )}
    >
      {pulse && (
        <span className={cn('size-1.5 rounded-full animate-pulse', TONE_DOT[tone])} />
      )}
      {icon && <span className="shrink-0 inline-flex">{icon}</span>}
      <span className="truncate">{children}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label="Remove"
          className="ml-0.5 -mr-0.5 grid place-items-center size-4 rounded-full hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
});
