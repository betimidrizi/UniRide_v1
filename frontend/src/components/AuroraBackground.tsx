import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Subtle: top-only mesh. Full: covers viewport with floating orbs. */
  variant?: 'subtle' | 'full';
}

/** Animated aurora mesh background — sits behind every page. */
export function AuroraBackground({ children, variant = 'subtle' }: Props) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh-aurora bg-[length:200%_200%] opacity-50 animate-aurora-shift" />

      {variant === 'full' && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-32 -z-10 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -right-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/25 blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-1/3 right-1/4 -z-10 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl"
            animate={{ x: [0, 25, 0], y: [0, 15, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }}
      />

      {children}
    </div>
  );
}
