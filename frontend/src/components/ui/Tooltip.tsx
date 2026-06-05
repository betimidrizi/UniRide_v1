import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Side = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  side?: Side;
  /** Open delay in ms (default 250). */
  delay?: number;
  children: ReactNode;
  className?: string;
  /** Force-disable the tooltip (e.g. while content is empty). */
  disabled?: boolean;
}

const SIDE_POSITION: Record<Side, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2'
};

const SIDE_OFFSET: Record<Side, { x: number; y: number }> = {
  top: { x: 0, y: 8 },
  bottom: { x: 0, y: -8 },
  left: { x: 8, y: 0 },
  right: { x: -8, y: 0 }
};

export function Tooltip({
  content,
  side = 'top',
  delay = 250,
  children,
  className,
  disabled = false
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const tid = useId();
  const timer = useRef<number | null>(null);

  const show = () => {
    if (disabled || !content) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setOpen(false);
  };

  const triggerEl = isValidElement(children) ? (
    cloneElement(children as ReactElement, {
      'aria-describedby': open ? tid : undefined
    })
  ) : (
    <span>{children}</span>
  );

  const offset = SIDE_OFFSET[side];

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {triggerEl}
      <AnimatePresence>
        {open && (
          <motion.span
            key="tooltip"
            id={tid}
            role="tooltip"
            initial={{ opacity: 0, x: offset.x, y: offset.y }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: offset.x, y: offset.y }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={cn(
              'pointer-events-none absolute z-[90] whitespace-nowrap text-xs text-slate-100',
              'px-2 py-1 rounded-lg bg-ink-900/95 backdrop-blur-xl border border-white/10 shadow-glow',
              SIDE_POSITION[side],
              className
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
