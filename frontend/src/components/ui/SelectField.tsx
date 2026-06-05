import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: ReactNode;
  hint?: string;
  error?: string;
  options: SelectOption[];
  /** Placeholder shown as a disabled first option when no value is selected. */
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, icon, hint, error, options, placeholder, className, ...props },
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
        <select
          ref={ref}
          className={cn(
            'input appearance-none cursor-pointer pr-10',
            icon && 'input-icon',
            error && 'border-rose-500/50 focus:ring-rose-500/20',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden className="bg-ink-800 text-slate-500">
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option
              key={o.value}
              value={o.value}
              disabled={o.disabled}
              className="bg-ink-800 text-slate-100"
            >
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <ChevronDown className="size-4" />
        </span>
      </div>
      {error ? (
        <span className="mt-1.5 block text-xs text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
});
