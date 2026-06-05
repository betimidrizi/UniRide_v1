import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-10 text-center flex flex-col items-center gap-3"
    >
      {icon && (
        <div className="grid place-items-center size-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-fuchsia-500/20 border border-white/10 text-brand-300">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-md">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

export function Skeleton({ className = 'h-24 w-full' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}
