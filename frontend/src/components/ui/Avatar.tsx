import { motion } from 'framer-motion';
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  name: string;
  size?: number;
  className?: string;
}

const GRADIENTS = [
  'from-brand-500 to-fuchsia-500',
  'from-accent-500 to-brand-500',
  'from-fuchsia-500 to-rose-500',
  'from-emerald-500 to-accent-500',
  'from-amber-500 to-fuchsia-500',
  'from-cyan-500 to-violet-500'
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({ name, size = 40, className }: Props) {
  const gradient = GRADIENTS[hash(name) % GRADIENTS.length];
  return (
    <motion.div
      whileHover={{ scale: 1.06 }}
      className={cn(
        'relative grid place-items-center rounded-full font-semibold text-white select-none',
        `bg-gradient-to-br ${gradient}`,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      <span>{initials(name)}</span>
    </motion.div>
  );
}
