import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DropdownMenuContext {
  close: () => void;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  align?: 'left' | 'right';
  children: ReactNode;
  /** Optional offset from the trigger in px (default 8). */
  offset?: number;
  className?: string;
}

export function DropdownMenu({
  trigger,
  align = 'left',
  children,
  offset = 8,
  className
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const triggerEl = isValidElement(trigger) ? (
    cloneElement(trigger as ReactElement, {
      onClick: (e: React.MouseEvent) => {
        const original = (trigger as ReactElement).props.onClick;
        original?.(e);
        if (!e.defaultPrevented) setOpen((v) => !v);
      },
      'aria-haspopup': 'menu',
      'aria-expanded': open
    })
  ) : (
    <button type="button" onClick={() => setOpen((v) => !v)}>
      {trigger}
    </button>
  );

  return (
    <div ref={rootRef} className="relative inline-flex">
      {triggerEl}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ marginTop: offset }}
            className={cn(
              'absolute z-50 min-w-[12rem] top-full p-1.5',
              'bg-ink-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-glow',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
            onClickCapture={(e) => {
              // Close after item activation (but not on disabled / separator)
              const target = e.target as HTMLElement;
              if (target.closest('[data-dropdown-item]:not([data-disabled])')) {
                // schedule close to allow item onClick to run first
                window.setTimeout(close, 0);
              }
            }}
          >
            <DropdownMenuContextProvider value={{ close }}>{children}</DropdownMenuContextProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Lightweight context without importing React.createContext separately for type clarity
import { createContext, useContext } from 'react';
const Ctx = createContext<DropdownMenuContext | null>(null);
function DropdownMenuContextProvider({
  value,
  children
}: {
  value: DropdownMenuContext;
  children: ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDropdownMenu(): DropdownMenuContext {
  return useContext(Ctx) ?? { close: () => undefined };
}

interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger';
  icon?: ReactNode;
}

export function DropdownMenuItem({
  variant = 'default',
  icon,
  className,
  children,
  disabled,
  ...rest
}: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      data-dropdown-item
      data-disabled={disabled ? '' : undefined}
      disabled={disabled}
      className={cn(
        'group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left',
        'transition-colors outline-none',
        'focus-visible:bg-white/5',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variant === 'danger'
          ? 'text-rose-300 hover:bg-rose-500/10 hover:text-rose-200'
          : 'text-slate-200 hover:bg-white/5 hover:text-white',
        className
      )}
      {...rest}
    >
      {icon && <span className="shrink-0 size-4 grid place-items-center text-slate-400 group-hover:text-current">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn('my-1 h-px bg-white/10', className)} />;
}

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'px-3 pt-1.5 pb-1 text-[10px] uppercase tracking-wider font-semibold text-slate-500',
        className
      )}
    >
      {children}
    </div>
  );
}
