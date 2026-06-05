import { useState, useId } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

interface RatingStarsProps {
  value: number;
  max?: number;
  size?: Size;
  /** When provided, the component is interactive (hover preview + click to set). */
  onChange?: (value: number) => void;
  /** Show a small numeric label next to the stars (e.g. "4.5"). */
  showValue?: boolean;
  /** Read-only label appended after numeric value (e.g. "(124)"). */
  countLabel?: string;
  className?: string;
  /** When true, allows half-step selection via clicking the left half of a star. */
  allowHalf?: boolean;
  ariaLabel?: string;
}

const SIZE_PX: Record<Size, number> = { sm: 14, md: 18, lg: 22 };
const SIZE_GAP: Record<Size, string> = { sm: 'gap-0.5', md: 'gap-1', lg: 'gap-1.5' };
const TEXT_SIZE: Record<Size, string> = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export function RatingStars({
  value,
  max = 5,
  size = 'md',
  onChange,
  showValue = false,
  countLabel,
  className,
  allowHalf = false,
  ariaLabel
}: RatingStarsProps) {
  const interactive = Boolean(onChange);
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId().replace(/:/g, '');

  const display = hover ?? value;
  const safeValue = Math.max(0, Math.min(max, display));

  const px = SIZE_PX[size];

  return (
    <div
      className={cn('inline-flex items-center', SIZE_GAP[size], className)}
      role={interactive ? 'slider' : 'img'}
      aria-label={ariaLabel ?? `Rating: ${value} out of ${max}`}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? max : undefined}
      aria-valuenow={interactive ? value : undefined}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          onChange?.(Math.min(max, value + (allowHalf ? 0.5 : 1)));
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          onChange?.(Math.max(0, value - (allowHalf ? 0.5 : 1)));
        } else if (e.key === 'Home') {
          e.preventDefault();
          onChange?.(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          onChange?.(max);
        }
      }}
      tabIndex={interactive ? 0 : -1}
    >
      <svg width={0} height={0} className="absolute" aria-hidden>
        <defs>
          <linearGradient id={`rating-fill-${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>

      {Array.from({ length: max }).map((_, i) => {
        const pos = i + 1;
        const fillRatio = Math.max(0, Math.min(1, safeValue - i));
        const StarVisual = (
          <span
            className="relative inline-block"
            style={{ width: px, height: px }}
            aria-hidden
          >
            <Star
              className="absolute inset-0 text-slate-600/70"
              style={{ width: px, height: px }}
              strokeWidth={1.6}
              fill="none"
            />
            {fillRatio > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillRatio * 100}%` }}
              >
                <Star
                  style={{ width: px, height: px }}
                  className="text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]"
                  strokeWidth={1.4}
                  fill={`url(#rating-fill-${gradId})`}
                  stroke="rgb(245 158 11)"
                />
              </span>
            )}
          </span>
        );

        if (!interactive) return <span key={i}>{StarVisual}</span>;

        return (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(pos)}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => {
              let next: number = pos;
              if (allowHalf) {
                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                const half = e.clientX - rect.left < rect.width / 2;
                next = half ? pos - 0.5 : pos;
              }
              onChange?.(next);
            }}
            onFocus={() => setHover(pos)}
            onBlur={() => setHover(null)}
            aria-label={`Rate ${pos} out of ${max}`}
            className="inline-flex items-center justify-center rounded transition-transform hover:scale-110 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
          >
            {StarVisual}
          </button>
        );
      })}

      {(showValue || countLabel) && (
        <span className={cn('ml-1 text-slate-300 font-medium', TEXT_SIZE[size])}>
          {showValue && <span className="text-white">{value.toFixed(1)}</span>}
          {countLabel && <span className="ml-1 text-slate-500">{countLabel}</span>}
        </span>
      )}
    </div>
  );
}
