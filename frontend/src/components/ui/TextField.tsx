import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  hint?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, icon, hint, error, className, ...props },
  ref
) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn('input', icon && 'input-icon', error && 'border-rose-500/50 focus:ring-rose-500/20', className)}
          {...props}
        />
      </div>
      {error ? (
        <span className="mt-1.5 block text-xs text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
});

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, className, ...props },
  ref
) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <textarea ref={ref} className={cn('input min-h-[80px] resize-none', className)} {...props} />
    </label>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <select className={cn('input appearance-none cursor-pointer pr-10', className)} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-800">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
