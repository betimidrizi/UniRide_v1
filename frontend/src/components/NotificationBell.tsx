import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, BellOff } from 'lucide-react';

import { notificationsApi } from '@/api/notifications';
import { formatRelative } from '@/lib/utils';

interface Props {
  className?: string;
}

export function NotificationBell({ className }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const qc = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true
  });

  const { data: list = [] } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationsApi.mine(3),
    enabled: open,
    staleTime: 10_000
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'recent'] });
    }
  });

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);
  const recent = [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative grid place-items-center size-10 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-[10px] font-bold text-white shadow-lg shadow-brand-500/30">
            {badgeText}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="menu"
            className="absolute right-0 mt-2 w-[20rem] max-w-[calc(100vw-2rem)] glass p-3 z-50 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between px-1 pb-2 border-b border-white/5 mb-2">
              <p className="font-display text-sm font-bold text-white">
                Notifications{' '}
                {unreadCount > 0 && (
                  <span className="text-slate-500 font-medium">({unreadCount} new)</span>
                )}
              </p>
              <button
                className="text-xs text-brand-300 hover:text-brand-200 inline-flex items-center gap-1 disabled:opacity-50"
                onClick={() => markAll.mutate()}
                disabled={unreadCount === 0 || markAll.isPending}
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            </div>

            {recent.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <div className="mx-auto mb-2 grid place-items-center size-10 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400">
                  <BellOff className="size-4" />
                </div>
                <p className="text-sm text-slate-300">You're all caught up.</p>
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                {recent.slice(0, 3).map((n) => (
                  <li
                    key={n.notificationId}
                    className={
                      n.isRead
                        ? 'px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5'
                        : 'px-3 py-2.5 rounded-xl bg-white/[0.04] border border-brand-400/20 relative'
                    }
                  >
                    {!n.isRead && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-brand-400 animate-pulse" />
                    )}
                    <p
                      className={
                        n.isRead
                          ? 'text-xs text-slate-300 leading-relaxed pl-2'
                          : 'text-xs text-white leading-relaxed pl-2 font-medium'
                      }
                    >
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 pl-2">
                      {formatRelative(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-2 pt-2 border-t border-white/5">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold text-brand-300 hover:text-brand-200 py-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
