import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, subtitle, description, actions, eyebrow }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300 mb-2"
          >
            {eyebrow}
          </motion.p>
        )}
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && <p className="text-lg gradient-text font-semibold mt-1">{subtitle}</p>}
        {description && <p className="text-slate-400 mt-2 max-w-xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
