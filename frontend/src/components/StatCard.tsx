import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  accent?: 'brand' | 'fuchsia' | 'accent' | 'emerald' | 'amber';
  delta?: number;
}

const ACCENT_MAP = {
  brand: 'from-brand-500 to-fuchsia-500 text-brand-300',
  fuchsia: 'from-fuchsia-500 to-rose-500 text-fuchsia-300',
  accent: 'from-accent-500 to-brand-500 text-accent-300',
  emerald: 'from-emerald-500 to-accent-500 text-emerald-300',
  amber: 'from-amber-500 to-rose-500 text-amber-300'
};

export function StatCard({ label, value, icon, hint, accent = 'brand', delta }: Props) {
  const classes = ACCENT_MAP[accent];
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="glass glass-hover relative overflow-hidden p-5 flex items-start gap-4"
    >
      <div className={`absolute -top-12 -right-12 size-32 rounded-full bg-gradient-to-br ${classes} opacity-20 blur-2xl`} />
      {icon && (
        <div className={`relative grid place-items-center size-11 rounded-xl bg-gradient-to-br ${classes} bg-opacity-15`}>
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${classes} opacity-25`} />
          <span className="relative text-white">{icon}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
        <p className="font-display text-2xl font-bold text-white mt-0.5 tracking-tight">{value}</p>
        {(hint || typeof delta === 'number') && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            {typeof delta === 'number' && (
              <span className={`inline-flex items-center gap-0.5 ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {Math.abs(delta)}%
              </span>
            )}
            {hint}
          </p>
        )}
      </div>
    </motion.div>
  );
}
