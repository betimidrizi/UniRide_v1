import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass } from 'lucide-react';
import { AuroraBackground } from '@/components/AuroraBackground';
import { Logo } from '@/components/Logo';

export function NotFoundPage() {
  return (
    <AuroraBackground variant="full">
      <div className="min-h-screen grid place-items-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="glass w-full max-w-lg p-10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />

          <div className="mb-6 flex justify-center">
            <Logo size={48} withWordmark />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-7xl sm:text-8xl font-extrabold tracking-tight"
          >
            <span className="gradient-text">404</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-3 font-display text-xl font-bold text-white"
          >
            This page doesn't exist
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-2 text-slate-400 text-sm max-w-sm mx-auto"
          >
            Looks like the route you took has been cancelled. Let's get you back on the road.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/" className="btn-primary">
              <Home className="size-4" />
              Take me home
            </Link>
            <Link to="/rides" className="btn-secondary">
              <Compass className="size-4" />
              Browse rides
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </AuroraBackground>
  );
}
