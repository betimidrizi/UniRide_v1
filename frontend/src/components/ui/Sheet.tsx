import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Side = 'right' | 'bottom' | 'left';
type Size = 'sm' | 'md' | 'lg';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  side?: Side;
  size?: Size;
  children?: ReactNode;
  className?: string;
  hideCloseButton?: boolean;
  /** When true (default), clicking backdrop closes. */
  closeOnBackdropClick?: boolean;
}

const SIDE_TO_SIZE: Record<Side, Record<Size, string>> = {
  right: { sm: 'w-80', md: 'w-[420px]', lg: 'w-[560px]' },
  left: { sm: 'w-80', md: 'w-[420px]', lg: 'w-[560px]' },
  bottom: { sm: 'max-h-[50vh]', md: 'max-h-[70vh]', lg: 'max-h-[85vh]' }
};

const SIDE_TO_POSITION: Record<Side, string> = {
  right: 'top-0 right-0 bottom-0',
  left: 'top-0 left-0 bottom-0',
  bottom: 'left-0 right-0 bottom-0'
};

const SIDE_TO_INITIAL: Record<Side, { x?: string | number; y?: string | number }> = {
  right: { x: '100%' },
  left: { x: '-100%' },
  bottom: { y: '100%' }
};

const SIDE_TO_RADIUS: Record<Side, string> = {
  right: 'rounded-l-2xl',
  left: 'rounded-r-2xl',
  bottom: 'rounded-t-2xl'
};

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('data-focus-skip')
  );
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  side = 'right',
  size = 'md',
  children,
  className,
  hideCloseButton = false,
  closeOnBackdropClick = true
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => {
      const focusables = getFocusable(panelRef.current);
      (focusables[0] ?? panelRef.current)?.focus();
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
        return;
      }
      if (e.key === 'Tab') {
        const focusables = getFocusable(panelRef.current);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !panelRef.current?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onOpenChange]);

  if (typeof document === 'undefined') return null;

  const sizeClasses =
    side === 'bottom'
      ? `w-full ${SIDE_TO_SIZE.bottom[size]}`
      : `h-full ${SIDE_TO_SIZE[side][size]} max-w-full`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet-root"
          className="fixed inset-0 z-[80]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <button
            type="button"
            aria-label="Close panel"
            tabIndex={-1}
            data-focus-skip
            onClick={() => closeOnBackdropClick && onOpenChange(false)}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm cursor-default"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'sheet-title' : undefined}
            aria-describedby={description ? 'sheet-desc' : undefined}
            tabIndex={-1}
            initial={SIDE_TO_INITIAL[side]}
            animate={{ x: 0, y: 0 }}
            exit={SIDE_TO_INITIAL[side]}
            transition={{ duration: 0.28, ease: [0.22, 0.85, 0.35, 1] }}
            className={cn(
              'absolute',
              SIDE_TO_POSITION[side],
              sizeClasses,
              'bg-ink-900/85 backdrop-blur-2xl border-white/10 shadow-glow-lg',
              side === 'right' && 'border-l',
              side === 'left' && 'border-r',
              side === 'bottom' && 'border-t',
              SIDE_TO_RADIUS[side],
              'p-5 outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40',
              'flex flex-col',
              className
            )}
          >
            {!hideCloseButton && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="absolute right-3 top-3 grid place-items-center size-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
            {(title || description) && (
              <header className="mb-4 pr-8 shrink-0">
                {title && (
                  <h2 id="sheet-title" className="font-display text-xl font-bold text-white">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="sheet-desc" className="mt-1 text-sm text-slate-400">
                    {description}
                  </p>
                )}
              </header>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto text-sm text-slate-200 -mr-2 pr-2">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
