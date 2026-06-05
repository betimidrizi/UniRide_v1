import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Bell, BellOff, Check, CheckCheck, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Skeleton } from '@/components/EmptyState';
import { notificationsApi } from '@/api/notifications';
import { extractError } from '@/api/client';
import { formatRelative } from '@/lib/utils';

export function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.mine(30)
  });

  const sorted = [...(data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (err) => toast.error(extractError(err))
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('All notifications marked as read.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const remove = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'recent'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (err) => toast.error(extractError(err))
  });

  const clearRead = useMutation({
    mutationFn: notificationsApi.deleteRead,
    onSuccess: (deleted) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'recent'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success(deleted === 0 ? 'No read notifications to clear.' : `Deleted ${deleted} read notification${deleted === 1 ? '' : 's'}.`);
    },
    onError: (err) => toast.error(extractError(err))
  });

  const clearAll = useMutation({
    mutationFn: notificationsApi.deleteAll,
    onSuccess: (deleted) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'recent'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success(deleted === 0 ? 'No notifications to clear.' : `Deleted ${deleted} notification${deleted === 1 ? '' : 's'}.`);
    },
    onError: (err) => toast.error(extractError(err))
  });

  const unreadCount = sorted.filter((n) => !n.isRead).length;

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        description="Updates about your rides, reservations, and reviews."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn-secondary"
              disabled={unreadCount === 0 || markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="size-4" />
              Mark all read
            </button>
            <button
              className="btn-secondary"
              disabled={sorted.every((n) => !n.isRead) || clearRead.isPending}
              onClick={() => clearRead.mutate()}
            >
              <Trash2 className="size-4" />
              Clear read
            </button>
            <button
              className="btn-danger"
              disabled={sorted.length === 0 || clearAll.isPending}
              onClick={() => {
                if (confirm('Delete all notifications?')) clearAll.mutate();
              }}
            >
              <Trash2 className="size-4" />
              Clear all
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<BellOff />}
          title="No notifications yet"
          description="When you reserve a ride or get a review, you'll see updates here."
        />
      ) : (
        <ul className="space-y-2.5">
          {sorted.map((n, i) => (
            <motion.li
              key={n.notificationId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.2) }}
              className={
                n.isRead
                  ? 'glass p-4 flex items-start gap-4'
                  : 'glass glass-hover p-4 flex items-start gap-4 relative overflow-hidden ring-1 ring-brand-400/30'
              }
            >
              {!n.isRead && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-fuchsia-400" />
              )}
              <span
                className={
                  n.isRead
                    ? 'grid place-items-center size-10 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 shrink-0'
                    : 'grid place-items-center size-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-fuchsia-500/20 border border-white/10 text-brand-300 shrink-0'
                }
              >
                <Bell className="size-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={
                    n.isRead
                      ? 'text-sm text-slate-300 leading-relaxed'
                      : 'text-sm text-white leading-relaxed font-medium'
                  }
                >
                  {n.message}
                </p>
                <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5">
                  {!n.isRead && <span className="size-1.5 rounded-full bg-brand-400 animate-pulse" />}
                  {formatRelative(n.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!n.isRead && (
                  <button
                    className="btn-ghost !py-1.5 !px-3"
                    onClick={() => markRead.mutate(n.notificationId)}
                    disabled={markRead.isPending}
                  >
                    <Check className="size-3.5" />
                    Mark read
                  </button>
                )}
                <button
                  className="btn-ghost !py-1.5 !px-3 text-rose-300 hover:text-rose-200"
                  onClick={() => remove.mutate(n.notificationId)}
                  disabled={remove.isPending}
                  title="Delete notification"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </>
  );
}
