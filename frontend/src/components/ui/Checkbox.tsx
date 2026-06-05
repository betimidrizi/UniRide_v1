import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  hint?: ReactNode;
  /** Render as a tri-state indeterminate checkbox. */
  indeterminate?: boolean;
  size?: 'sm' | 'md';
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  {
    checked,
    onCheckedChange,
    label,
    hint,
    indeterminate = false,
    size = 'md',
    disabled,
    className,
    id,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const sizes = size === 'sm' ? 'size-4' : 'size-5';
  const iconSize = size === 'sm' ? 'size-3' : 'size-3.5';
  const filled = checked || indeterminate;

  const box = (
    <button
      ref={ref}
      id={inputId}
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-md border transition-all',
        'outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900',
        sizes,
        filled
          ? 'bg-gradient-to-br from-brand-500 to-fuchsia-500 border-transparent shadow-glow'
          : 'bg-white/[0.04] border-white/15 hover:border-white/30',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      {...rest}
    >
      <AnimatePresence initial={false}>
        {filled && (
          <motion.span
            key={indeterminate ? 'indet' : 'check'}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="text-white"
          >
            {indeterminate ? (
              <Minus className={cn(iconSize, 'stroke-[3]')} />
            ) : (
              <Check className={cn(iconSize, 'stroke-[3]')} />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  if (!label && !hint) return box;

  return (
    <label htmlFor={inputId} className="flex items-start gap-2.5 cursor-pointer select-none">
      <span className="mt-0.5">{box}</span>
      <span className="min-w-0">
        {label && <p className="text-sm text-white leading-snug">{label}</p>}
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </span>
    </label>
  );
});
