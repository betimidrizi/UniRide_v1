import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Flag, SearchX } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Skeleton } from '@/components/EmptyState';
import { reportsApi } from '@/api/reports';
import { extractError } from '@/api/client';
import { formatDateTime } from '@/lib/utils';
import type { ReportStatus } from '@/types';

export function AdminReportsPage() {
  const qc = useQueryClient();
  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: reportsApi.all
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReportStatus }) =>
      reportsApi.setStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
      toast.success('Report updated.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  return (
    <>
      <PageHeader eyebrow="Admin" title="Reports" subtitle="Review user and ride reports." />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !reports || reports.length === 0 ? (
        <EmptyState icon={<SearchX />} title="No reports yet." />
      ) : (
        <div className="space-y-3">
          {reports.map((r, i) => (
            <motion.div
              key={r.reportId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.2) }}
              className="glass p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="grid place-items-center size-10 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300">
                  <Flag className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={r.status === 'Open' ? 'chip-pending' : r.status === 'Resolved' ? 'chip-open' : 'chip-cancelled'}>
                      {r.status}
                    </span>
                    <span className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</span>
                  </div>
                  <p className="font-semibold text-white">{r.reason}</p>
                  <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{r.details || 'No details provided.'}</p>
                  <p className="text-xs text-slate-500 mt-3">
                    Reporter: {r.reporterName || `User #${r.reporterId}`}
                    {r.targetUserName ? ` | User: ${r.targetUserName}` : ''}
                    {r.rideRoute ? ` | Ride: ${r.rideRoute}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-success !px-3"
                    disabled={setStatus.isPending || r.status === 'Resolved'}
                    onClick={() => setStatus.mutate({ id: r.reportId, status: 'Resolved' })}
                  >
                    <CheckCircle2 className="size-3.5" /> Resolve
                  </button>
                  <button
                    className="btn-secondary !px-3"
                    disabled={setStatus.isPending || r.status === 'Dismissed'}
                    onClick={() => setStatus.mutate({ id: r.reportId, status: 'Dismissed' })}
                  >
                    Dismiss
                  </button>
                  {r.status !== 'Open' && (
                    <button
                      className="btn-secondary !px-3"
                      disabled={setStatus.isPending}
                      onClick={() => setStatus.mutate({ id: r.reportId, status: 'Open' })}
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
