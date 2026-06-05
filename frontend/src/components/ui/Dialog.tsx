import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  size?: Size;
  children?: ReactNode;
  /** When true (default), clicking the backdrop closes the dialog. */
  closeOnBackdropClick?: boolean;
  /** When true (default), pressing Escape closes the dialog. */
  closeOnEscape?: boolean;
  /** Hide the top-right close button. */
  hideCloseButton?: boolean;
  className?: string;
}

const SIZE_MAP: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl'
};

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('data-focus-skip')
  );
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  hideCloseButton = false,
  className
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Focus trap + restore focus on close
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => {
      const focusables = getFocusable(panelRef.current);
      (focusables[0] ?? panelRef.current)?.focus();
    }, 40);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.stopPropagation();
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

    document.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', handleKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, closeOnEscape, onOpenChange]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="dialog-root"
          className="fixed inset-0 z-[80] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          aria-hidden={!open}
        >
          <button
            type="button"
            aria-label="Close dialog"
            tabIndex={-1}
            data-focus-skip
            onClick={() => closeOnBackdropClick && onOpenChange(false)}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm cursor-default"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'dialog-title' : undefined}
            aria-describedby={description ? 'dialog-desc' : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={cn(
              'relative w-full glass p-6 outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40',
              SIZE_MAP[size],
              className
            )}
          >
            {!hideCloseButton && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="absolute right-3 top-3 grid place-items-center size-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
              >
                <X className="size-4" />
              </button>
            )}
            {(title || description) && (
              <header className="mb-4 pr-8">
                {title && (
                  <h2 id="dialog-title" className="font-display text-xl font-bold text-white">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="dialog-desc" className="mt-1 text-sm text-slate-400">
                    {description}
                  </p>
                )}
              </header>
            )}
            <div className="text-sm text-slate-200">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'primary',
  loading = false
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = useCallback(async () => {
    try {
      setBusy(true);
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }, [onConfirm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} size="sm">
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => onOpenChange(false)}
          disabled={busy || loading}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          onClick={handleConfirm}
          disabled={busy || loading}
        >
          {busy || loading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

interface ConfirmOptions {
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  title: string;
  resolver?: (value: boolean) => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({ open: false, title: '' });

  const confirm = useCallback(
    (title: string, options: ConfirmOptions = {}): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        setState({ open: true, title, ...options, resolver: resolve });
      }),
    []
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        state.resolver?.(false);
        setState((s) => ({ ...s, open: false, resolver: undefined }));
      }
    },
    [state]
  );

  const handleConfirm = useCallback(() => {
    state.resolver?.(true);
    setState((s) => ({ ...s, open: false, resolver: undefined }));
  }, [state]);

  const dialog = (
    <ConfirmDialog
      open={state.open}
      onOpenChange={handleOpenChange}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={handleConfirm}
    />
  );

  return useMemo(() => ({ confirm, dialog }), [confirm, dialog]);
}

// Optional provider-style hook so the dialog can be used app-wide via context.
interface ConfirmContextValue {
  confirm: (title: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { confirm, dialog } = useConfirm();
  const value = useMemo(() => ({ confirm }), [confirm]);
  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog}
    </ConfirmContext.Provider>
  );
}

export function useConfirmContext(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirmContext must be used inside <ConfirmProvider>');
  return ctx;
}
