import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  hint?: ReactNode;
  /** Visual size. Default 'md'. */
  size?: 'sm' | 'md';
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, label, hint, size = 'md', disabled, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const dims =
    size === 'sm'
      ? { track: 'h-5 w-9', thumb: 18, offset: 2 }
      : { track: 'h-6 w-11', thumb: 20, offset: 2 };

  const knob = (
    <button
      ref={ref}
      id={inputId}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors',
        'outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900',
        dims.track,
        checked
          ? 'bg-gradient-to-r from-brand-500 to-fuchsia-500 shadow-glow'
          : 'bg-slate-700/80 border border-white/10',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      {...rest}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        style={{
          width: dims.thumb,
          height: dims.thumb,
          marginLeft: checked
            ? `calc(100% - ${dims.thumb}px - ${dims.offset}px)`
            : `${dims.offset}px`
        }}
        className="rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
      />
    </button>
  );

  if (!label && !hint) return knob;

  return (
    <label htmlFor={inputId} className="flex items-center gap-3 cursor-pointer select-none">
      {knob}
      <div className="min-w-0">
        {label && <p className="text-sm text-white font-medium leading-tight">{label}</p>}
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
    </label>
  );
});
