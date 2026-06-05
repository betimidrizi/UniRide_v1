import { motion } from 'framer-motion';

interface Props {
  size?: number;
  className?: string;
  withWordmark?: boolean;
}

export function Logo({ size = 40, className = '', withWordmark = true }: Props) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <motion.div
        className="relative grid place-items-center rounded-xl"
        style={{ width: size, height: size }}
        whileHover={{ rotate: -3, scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 via-fuchsia-500 to-accent-500" />
        <div className="absolute inset-[1px] rounded-[11px] bg-ink-900/60 backdrop-blur" />
        <span className="relative font-display font-extrabold text-white" style={{ fontSize: size * 0.42 }}>
          UR
        </span>
        <span
          className="pointer-events-none absolute -inset-1 rounded-2xl bg-brand-500/40 blur-xl opacity-60"
          aria-hidden
        />
      </motion.div>
      {withWordmark && (
        <span className="font-display text-xl font-extrabold tracking-tight">
          Uni<span className="gradient-text">Ride</span>
        </span>
      )}
    </div>
  );
}
