import {
  createContext,
  useContext,
  useId,
  useMemo,
  type ButtonHTMLAttributes,
  type ReactNode
} from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  layoutId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs subcomponents must be used inside <Tabs>');
  return ctx;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  const baseId = useId();
  const ctx = useMemo<TabsContextValue>(
    () => ({ value, onValueChange, layoutId: `tabs-underline-${baseId}` }),
    [value, onValueChange, baseId]
  );
  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn('flex flex-col gap-3', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
  /** Use the pill-style segmented control. Default 'underline'. */
  variant?: 'underline' | 'pill';
}

export function TabsList({ children, className, variant = 'underline' }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1',
        variant === 'underline'
          ? 'border-b border-white/10 px-1'
          : 'p-1 bg-white/[0.04] border border-white/10 rounded-xl',
        className
      )}
      data-variant={variant}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  children: ReactNode;
}

export function TabsTrigger({ value, children, className, ...rest }: TabsTriggerProps) {
  const { value: active, onValueChange, layoutId } = useTabs();
  const selected = active === value;

  // Detect parent variant via DOM data-attr through ARIA — fallback: keep both styles compatible.
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => onValueChange(value)}
      className={cn(
        'relative inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg',
        'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40',
        selected ? 'text-white' : 'text-slate-400 hover:text-slate-200',
        className
      )}
      {...rest}
    >
      <span className="relative z-10">{children}</span>
      {selected && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 -z-0 rounded-lg bg-gradient-to-r from-brand-500/15 to-fuchsia-500/15 border border-white/10"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      {selected && (
        <motion.span
          layoutId={`${layoutId}-underline`}
          className="absolute left-2 right-2 -bottom-[7px] h-[2px] rounded-full bg-gradient-to-r from-brand-400 via-fuchsia-400 to-accent-400"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  /** Force mount even when not selected. */
  keepMounted?: boolean;
}

export function TabsContent({ value, children, className, keepMounted = false }: TabsContentProps) {
  const { value: active } = useTabs();
  const selected = active === value;
  if (!selected && !keepMounted) return null;
  return (
    <motion.div
      role="tabpanel"
      hidden={!selected}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: selected ? 1 : 0, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(selected ? 'block' : 'hidden', className)}
    >
      {children}
    </motion.div>
  );
}
