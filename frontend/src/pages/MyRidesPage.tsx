import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Car,
  CheckCircle2,
  CircleDashed,
  Flag,
  MessageCircle,
  Plus,
  Play,
  Trash2,
  Users,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { RideCard } from '@/components/RideCard';
import { EmptyState, Skeleton } from '@/components/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { useConfirm } from '@/components/ui/Dialog';
import { ridesApi } from '@/api/rides';
import { reservationsApi } from '@/api/reservations';
import { extractError } from '@/api/client';
import type { Reservation } from '@/types';

export function MyRidesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [open, setOpen] = useState<Record<number, Reservation[] | undefined>>({});

  const { data: rides, isLoading } = useQuery({
    queryKey: ['my-rides'],
    queryFn: ridesApi.mine
  });

  const activeRideIds = useMemo(() => (rides ?? []).map((r) => r.rideId), [rides]);

  const { data: pendingRequests } = useQuery({
    queryKey: ['my-rides', 'pending-seat-requests', activeRideIds],
    enabled: activeRideIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        (rides ?? []).map(async (ride) => ({
          ride,
          passengers: await ridesApi.passengers(ride.rideId)
        }))
      );
      return results.flatMap(({ ride, passengers }) =>
        passengers
          .filter((p) => p.reservationStatus === 0)
          .map((p) => ({ ...p, route: `${ride.startLocation} -> ${ride.destination}` }))
      );
    }
  });

  const remove = useMutation({
    mutationFn: ridesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-rides'] });
      qc.invalidateQueries({ queryKey: ['rides'] });
      toast.success('Ride removed.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const startRide = useMutation({
    mutationFn: ridesApi.start,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-rides'] });
      toast.success('Ride started — passengers notified.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const completeRide = useMutation({
    mutationFn: ridesApi.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-rides'] });
      toast.success('Ride completed. Review your passengers!');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const approve = useMutation({
    mutationFn: reservationsApi.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-rides'] });
      qc.invalidateQueries({ queryKey: ['my-rides', 'pending-seat-requests'] });
      toast.success('Passenger approved.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const reject = useMutation({
    mutationFn: reservationsApi.reject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-rides'] });
      qc.invalidateQueries({ queryKey: ['my-rides', 'pending-seat-requests'] });
      toast.success('Passenger rejected.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  async function handleApprove(rideId: number, reservationId: number) {
    await approve.mutateAsync(reservationId);
    refreshPassengers(rideId);
  }

  async function handleReject(rideId: number, reservationId: number) {
    await reject.mutateAsync(reservationId);
    refreshPassengers(rideId);
  }

  async function togglePassengers(rideId: number) {
    if (open[rideId]) {
      setOpen((s) => ({ ...s, [rideId]: undefined }));
      return;
    }
    try {
      const data = await ridesApi.passengers(rideId);
      setOpen((s) => ({ ...s, [rideId]: data }));
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  async function refreshPassengers(rideId: number) {
    try {
      const data = await ridesApi.passengers(rideId);
      setOpen((s) => ({ ...s, [rideId]: data }));
    } catch {
      /* ignore */
    }
  }

  async function handleDelete(rideId: number) {
    const ok = await confirm('Delete this ride?', {
      description: 'Passengers with active reservations will block deletion.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep it',
      variant: 'danger'
    });
    if (ok) remove.mutate(rideId);
  }

  async function handleStart(rideId: number) {
    const ok = await confirm('Start this ride now?', {
      description: 'Passengers will be notified. New reservations will be blocked.',
      confirmLabel: 'Start ride',
      variant: 'primary'
    });
    if (ok) startRide.mutate(rideId);
  }

  async function handleComplete(rideId: number) {
    const ok = await confirm('Complete this ride?', {
      description: 'You and your passengers can leave reviews once the ride is marked complete.',
      confirmLabel: 'Mark complete',
      variant: 'primary'
    });
    if (ok) completeRide.mutate(rideId);
  }

  return (
    <>
      <PageHeader
        eyebrow="Driver"
        title="My rides"
        subtitle="Routes you've published."
        actions={
          <Link to="/rides/new" className="btn-primary">
            <Plus className="size-4" /> New ride
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : !rides || rides.length === 0 ? (
        <EmptyState
          icon={<Car />}
          title="You haven't published any rides yet."
          description="Got a car and a route? Offer a ride and start filling those seats."
          action={
            <Link to="/rides/new" className="btn-primary">
              <Plus className="size-4" /> Create your first ride
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {pendingRequests && pendingRequests.length > 0 && (
            <div className="glass p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <CircleDashed className="size-3" />
                Pending seat requests ({pendingRequests.length})
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {pendingRequests.map((p) => (
                  <div
                    key={p.reservationId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <Avatar name={p.passengerName || `User ${p.passengerId}`} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate font-medium">{p.passengerName || `User ${p.passengerId}`}</p>
                      <p className="text-xs text-slate-400 truncate">{p.route}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        className="btn-success !py-1.5 !px-3"
                        onClick={() => handleApprove(p.rideId, p.reservationId)}
                        disabled={approve.isPending || reject.isPending}
                      >
                        <CheckCircle2 className="size-3.5" /> Approve
                      </button>
                      <button
                        className="btn-danger !py-1.5 !px-3"
                        onClick={() => handleReject(p.rideId, p.reservationId)}
                        disabled={approve.isPending || reject.isPending}
                      >
                        <XCircle className="size-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {rides.map((ride, i) => (
            <div key={ride.rideId} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RideCard ride={ride} index={i} linkToDetail={false}>
                <div className="flex gap-2 flex-wrap">
                  {ride.status === 'Open' || ride.status === 'Full' ? (
                    <button className="btn-success !px-3" onClick={() => handleStart(ride.rideId)}>
                      <Play className="size-4" /> Start
                    </button>
                  ) : null}
                  {ride.status === 'InProgress' && (
                    <button className="btn-primary !px-3" onClick={() => handleComplete(ride.rideId)}>
                      <CheckCircle2 className="size-4" /> Complete
                    </button>
                  )}
                  <button className="btn-secondary !px-3" onClick={() => togglePassengers(ride.rideId)}>
                    <Users className="size-4" />
                    Passengers
                  </button>
                  <button className="btn-danger !px-3" onClick={() => handleDelete(ride.rideId)}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </RideCard>

              <AnimatePresence>
                {open[ride.rideId] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="glass p-4 h-full">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                        <Flag className="size-3" />
                        Passengers ({open[ride.rideId]?.length ?? 0})
                      </p>
                      {(!open[ride.rideId] || open[ride.rideId]!.length === 0) && (
                        <p className="text-sm text-slate-400">No passengers yet.</p>
                      )}
                      <div className="space-y-2">
                        {open[ride.rideId]?.map((p) => {
                          const status = p.reservationStatus;
                          return (
                            <div
                              key={p.reservationId}
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                            >
                              <Avatar name={p.passengerName || `User ${p.passengerId}`} size={36} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate font-medium">
                                  {p.passengerName || `User ${p.passengerId}`}
                                </p>
                                <span className={status === 0 ? 'chip-pending' : status === 1 ? 'chip-open' : 'chip-cancelled'}>
                                  {status === 0 && (<><CircleDashed className="size-3 animate-spin" /> Pending</>)}
                                  {status === 1 && 'Confirmed'}
                                  {status === 2 && 'Cancelled'}
                                </span>
                              </div>
                              {status === 0 ? (
                                <div className="flex gap-1.5">
                                  <button
                                    className="btn-success !py-1.5 !px-3"
                                    onClick={() => handleApprove(ride.rideId, p.reservationId)}
                                  >
                                    <CheckCircle2 className="size-3.5" /> Approve
                                  </button>
                                  <button
                                    className="btn-danger !py-1.5 !px-3"
                                    onClick={() => handleReject(ride.rideId, p.reservationId)}
                                  >
                                    <XCircle className="size-3.5" /> Reject
                                  </button>
                                </div>
                              ) : status === 1 ? (
                                <button
                                  className="btn-secondary !py-1.5 !px-3"
                                  onClick={() =>
                                    navigate(`/chat?rideId=${ride.rideId}&otherUserId=${p.passengerId}`)
                                  }
                                >
                                  <MessageCircle className="size-3.5" /> Message
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {dialog}
    </>
  );
}
