import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Star, Ticket, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Skeleton } from '@/components/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { ReviewModal } from '@/components/ReviewModal';
import { useConfirm } from '@/components/ui/Dialog';
import { reservationsApi } from '@/api/reservations';
import { ridesApi } from '@/api/rides';
import { extractError } from '@/api/client';
import { formatDateTime } from '@/lib/utils';
import type { Reservation } from '@/types';

export function ReservationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [reviewTarget, setReviewTarget] = useState<{
    rideId: number;
    targetUserId: number;
    targetUserName: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: reservationsApi.mine
  });

  // For each reservation, also know the ride status so we can render
  // the "Leave a review" CTA on completed rides.
  const { data: myReservedRides } = useQuery({
    queryKey: ['reservations', 'mine', 'rides'],
    queryFn: async () => {
      if (!data) return {} as Record<number, { status: string }>;
      const unique = Array.from(new Set(data.map((r) => r.rideId)));
      const results = await Promise.allSettled(unique.map((id) => ridesApi.byId(id)));
      const map: Record<number, { status: string; driverId: number; driverName: string }> = {};
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          map[unique[i]] = {
            status: res.value.status,
            driverId: res.value.driverId,
            driverName: res.value.driverName
          };
        }
      });
      return map;
    },
    enabled: Boolean(data && data.length > 0)
  });

  const cancel = useMutation({
    mutationFn: reservationsApi.cancel,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['reservations', 'mine'] });
      const snap = qc.getQueryData<Reservation[]>(['reservations', 'mine']);
      qc.setQueryData<Reservation[]>(['reservations', 'mine'], (old) =>
        (old ?? []).filter((r) => r.reservationId !== id)
      );
      return { snap };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.snap) qc.setQueryData(['reservations', 'mine'], ctx.snap);
      toast.error(extractError(err));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations', 'mine'] });
      qc.invalidateQueries({ queryKey: ['rides'] });
      toast.success('Reservation cancelled.');
    }
  });

  async function handleCancel(reservationId: number) {
    const ok = await confirm('Cancel this reservation?', {
      description: 'Your seat will be released back to the driver.',
      confirmLabel: 'Yes, cancel',
      cancelLabel: 'Keep it',
      variant: 'danger'
    });
    if (ok) cancel.mutate(reservationId);
  }

  return (
    <>
      <PageHeader
        eyebrow="Passenger"
        title="My reservations"
        subtitle="Your upcoming rides."
        description="Manage your active reservations, message drivers, or cancel a seat if your plans change."
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Ticket />}
          title="No active reservations."
          description="Find a ride and reserve a seat — your trips will show up here."
        />
      ) : (
        <div className="space-y-3">
          {data.map((r, i) => {
            const status = r.reservationStatus;
            const rideInfo = myReservedRides?.[r.rideId];
            const isCompleted = rideInfo?.status === 'Completed';
            const isPending = status === 0;
            const isConfirmed = status === 1;
            return (
              <motion.div
                key={r.reservationId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass glass-hover p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <Avatar name={r.driverName || `Driver ${r.driverId}`} size={48} />

                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold text-white flex items-center gap-2 truncate">
                    {r.startLocation} → {r.destination}
                  </p>
                  <p className="text-sm text-slate-300">
                    Driver: <span className="text-slate-200">{r.driverName || `User ${r.driverId}`}</span>
                  </p>
                  {r.departureTime && (
                    <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(r.departureTime)}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    {isPending && <span className="chip-pending">Awaiting driver approval</span>}
                    {isConfirmed && !isCompleted && <span className="chip-open">Confirmed</span>}
                    {isCompleted && <span className="chip-completed">Completed</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isCompleted ? (
                    <button
                      className="btn-primary"
                      onClick={() =>
                        setReviewTarget({
                          rideId: r.rideId,
                          targetUserId: r.driverId,
                          targetUserName: r.driverName || `User ${r.driverId}`
                        })
                      }
                    >
                      <Star className="size-4" />
                      Leave review
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn-secondary"
                        disabled={isPending}
                        onClick={() => navigate(`/chat?rideId=${r.rideId}&otherUserId=${r.driverId}`)}
                      >
                        <MessageCircle className="size-4" />
                        Message
                      </button>
                      <button className="btn-danger" onClick={() => handleCancel(r.reservationId)}>
                        <XCircle className="size-4" />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {dialog}

      {reviewTarget && (
        <ReviewModal
          open
          onClose={() => setReviewTarget(null)}
          rideId={reviewTarget.rideId}
          targetUserId={reviewTarget.targetUserId}
          targetUserName={reviewTarget.targetUserName}
          onSubmitted={() => {
            qc.invalidateQueries({ queryKey: ['reservations', 'mine'] });
            setReviewTarget(null);
          }}
        />
      )}
    </>
  );
}
