import { useMemo, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Euro,
  Flag,
  MapPin,
  MessageCircle,
  Play,
  Route,
  Share2,
  Star,
  Users,
  XCircle
} from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Skeleton } from '@/components/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { ridesApi } from '@/api/rides';
import { reservationsApi } from '@/api/reservations';
import { reportsApi } from '@/api/reports';
import { extractError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, formatPrice } from '@/lib/utils';

function formatTimeOnly(value?: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function RideDetailPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const id = Number(rideId);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: ride, isLoading, isError } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => ridesApi.byId(id),
    enabled: Number.isFinite(id) && id > 0,
    retry: false
  });

  const { data: reservations } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: reservationsApi.mine,
    enabled: Boolean(currentUserId)
  });

  const isDriver = Boolean(ride && currentUserId && ride.driverId === currentUserId);
  const myReservation = useMemo(() => reservations?.find((r) => r.rideId === id), [reservations, id]);

  const { data: passengers } = useQuery({
    queryKey: ['ride', id, 'passengers'],
    queryFn: () => ridesApi.passengers(id),
    enabled: isDriver
  });

  const join = useMutation({
    mutationFn: () => reservationsApi.join(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ride', id] });
      qc.invalidateQueries({ queryKey: ['rides'] });
      qc.invalidateQueries({ queryKey: ['reservations', 'mine'] });
      toast.success('Seat request sent. The driver will approve it.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const cancel = useMutation({
    mutationFn: (resId: number) => reservationsApi.cancel(resId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ride', id] });
      qc.invalidateQueries({ queryKey: ['reservations', 'mine'] });
      toast.success('Reservation cancelled.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const startRide = useMutation({
    mutationFn: () => ridesApi.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ride', id] });
      qc.invalidateQueries({ queryKey: ['rides'] });
      qc.invalidateQueries({ queryKey: ['my-rides'] });
      toast.success('Ride started. Passengers were notified.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const completeRide = useMutation({
    mutationFn: () => ridesApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ride', id] });
      qc.invalidateQueries({ queryKey: ['rides'] });
      qc.invalidateQueries({ queryKey: ['my-rides'] });
      toast.success('Ride completed.');
      navigate('/my-rides');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const report = useMutation({
    mutationFn: reportsApi.create,
    onSuccess: () => toast.success('Report submitted. Admin will review it.'),
    onError: (err) => toast.error(extractError(err))
  });

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied.');
    } catch {
      toast.error("Couldn't copy link.");
    }
  }

  function submitReport(target: 'ride' | 'driver') {
    const details = window.prompt(
      target === 'ride' ? 'Describe the ride issue for admin review:' : 'Describe the driver issue for admin review:'
    );
    if (details === null) return;
    const trimmed = details.trim();
    if (!trimmed) {
      toast.error('Please add report details.');
      return;
    }

    report.mutate({
      rideId: target === 'ride' ? ride?.rideId : undefined,
      targetUserId: target === 'driver' ? ride?.driverId : undefined,
      reason: target === 'ride' ? 'Ride issue' : 'User issue',
      details: trimmed
    });
  }

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <EmptyState
        icon={<Compass />}
        title="Invalid ride link"
        description="That ride id doesn't look right."
        action={<Link to="/rides" className="btn-primary">Browse rides</Link>}
      />
    );
  }

  if (isLoading) {
    return (
      <>
        <Skeleton className="h-12 w-2/3 mb-6" />
        <Skeleton className="h-64 mb-4" />
      </>
    );
  }

  if (isError || !ride) {
    return (
      <EmptyState
        icon={<Compass />}
        title="Ride not found"
        description="It may have been cancelled or removed. Try browsing available rides instead."
        action={<Link to="/rides" className="btn-primary">Find another ride</Link>}
      />
    );
  }

  const canReserve = ride.availableSeats > 0 && ride.status === 'Open';
  const isConfirmedPassenger = myReservation?.reservationStatus === 1;
  const isPendingPassenger = myReservation?.reservationStatus === 0;

  return (
    <>
      <PageHeader
        eyebrow="Ride details"
        title={`${ride.startLocation} -> ${ride.destination}`}
        subtitle={ride.university}
        description={`Departure ${formatDateTime(ride.departureTime)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={copyShareLink}>
              <Share2 className="size-4" />
              Share link
            </button>
            {!isDriver && (
              <button className="btn-danger" onClick={() => submitReport('ride')} disabled={report.isPending}>
                <Flag className="size-4" />
                Report ride
              </button>
            )}
          </div>
        }
      />

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-7 sm:p-10 mb-6">
        <div className="space-y-8">
          <RoutePoint label="From" place={ride.startLocation} time={`Departs ${formatTimeOnly(ride.departureTime)} · ${formatDateTime(ride.departureTime)}`} />
          <RoutePoint label="To" place={ride.destination} time={`Arrives ${formatTimeOnly(ride.expectedArrivalTime)}`} />
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Driver</p>
          <div className="flex items-center gap-4">
            <Avatar name={ride.driverName || `Driver ${ride.driverId}`} size={64} />
            <div className="min-w-0 flex-1">
              <Link to={`/drivers/${ride.driverId}`} className="font-display text-lg font-bold text-white hover:text-brand-300 truncate block">
                {ride.driverName || `Driver #${ride.driverId}`}
              </Link>
              <p className="text-sm text-slate-400 truncate">{ride.university}</p>
              <div className="mt-1 inline-flex items-center gap-1 text-amber-300 text-sm">
                <Star className="size-3.5 fill-amber-300" />
                4.7
              </div>
              {!isDriver && (
                <button
                  className="btn-secondary !py-1.5 !px-3 mt-3"
                  onClick={() => submitReport('driver')}
                  disabled={report.isPending}
                >
                  <Flag className="size-3.5" />
                  Report driver
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Trip</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatTile icon={<Calendar className="size-4" />} label="Departs" value={formatDateTime(ride.departureTime)} />
            <StatTile icon={<Clock className="size-4" />} label="Arrives" value={formatTimeOnly(ride.expectedArrivalTime)} />
            <StatTile icon={<Users className="size-4" />} label="Seats left" value={`${ride.availableSeats}`} accent={ride.availableSeats <= 1 ? 'warn' : undefined} />
            <StatTile icon={<Route className="size-4" />} label="Distance" value={`${ride.distanceKm} km`} />
            <StatTile icon={<Euro className="size-4" />} label="Price" value={formatPrice(ride.price)} accent="brand" />
          </div>
        </motion.div>
      </div>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
        {isDriver ? (
          <DriverActions
            rideId={ride.rideId}
            passengers={passengers ?? []}
            status={ride.status}
            busy={startRide.isPending || completeRide.isPending}
            onStart={() => startRide.mutate()}
            onComplete={() => completeRide.mutate()}
          />
        ) : myReservation ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-base font-bold text-white">
                {isConfirmedPassenger ? "You're confirmed on this ride" : 'Your request is waiting for approval'}
              </p>
              <p className="text-sm text-slate-400">
                {isConfirmedPassenger ? 'Message the driver or cancel if your plans change.' : 'Messaging opens after the driver approves your seat.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary"
                disabled={!isConfirmedPassenger}
                onClick={() => navigate(`/chat?rideId=${ride.rideId}&otherUserId=${ride.driverId}`)}
              >
                <MessageCircle className="size-4" />
                Message driver
              </button>
              {(isConfirmedPassenger || isPendingPassenger) && (
                <button
                  className="btn-danger"
                  disabled={cancel.isPending}
                  onClick={() => {
                    if (confirm('Cancel this reservation?')) cancel.mutate(myReservation.reservationId);
                  }}
                >
                  <XCircle className="size-4" />
                  Cancel reservation
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-base font-bold text-white">
                {canReserve ? `${ride.availableSeats} seat${ride.availableSeats === 1 ? '' : 's'} available` : 'Reservations closed'}
              </p>
              <p className="text-sm text-slate-400">
                {canReserve ? 'Request a seat and wait for driver approval.' : `This ride is ${ride.status.toLowerCase()}.`}
              </p>
            </div>
            <button className="btn-primary" disabled={!canReserve || join.isPending} onClick={() => join.mutate()}>
              Reserve seat
            </button>
          </div>
        )}
      </motion.section>
    </>
  );
}

function RoutePoint({ label, place, time }: { label: string; place: string; time: string }) {
  return (
    <div className="flex items-start gap-5">
      <span className="mt-1 grid place-items-center size-[32px] rounded-full bg-brand-500 shadow-[0_0_0_6px_rgba(139,92,246,0.25)]">
        <MapPin className="size-4 text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
        <p className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">{place}</p>
        <p className="text-sm text-slate-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

interface DriverActionsProps {
  rideId: number;
  passengers: { reservationId: number; passengerId: number; passengerName: string; reservationStatus: number }[];
  status: string;
  busy: boolean;
  onStart: () => void;
  onComplete: () => void;
}

function DriverActions({ rideId, passengers, status, busy, onStart, onComplete }: DriverActionsProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-base font-bold text-white">You're driving this ride</p>
          <p className="text-sm text-slate-400">Manage the trip and message confirmed passengers from here.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={onStart} disabled={busy || !['Open', 'Full'].includes(status)}>
            <Play className="size-4" />
            Start ride
          </button>
          <button className="btn-primary" onClick={onComplete} disabled={busy || !['Open', 'Full', 'InProgress'].includes(status)}>
            <CheckCircle2 className="size-4" />
            Complete ride
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Passengers</p>
        {passengers.length === 0 ? (
          <p className="text-sm text-slate-400">No passengers yet. Share the link to fill seats.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {passengers.map((p) => (
              <li key={p.reservationId} className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/10 p-3">
                <Avatar name={p.passengerName || `Passenger ${p.passengerId}`} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{p.passengerName || `Passenger #${p.passengerId}`}</p>
                  <span className={p.reservationStatus === 1 ? 'chip-open' : 'chip-pending'}>
                    {p.reservationStatus === 1 ? 'Confirmed' : 'Pending'}
                  </span>
                </div>
                {p.reservationStatus === 1 && (
                  <Link className="btn-secondary !py-1.5 !px-3" to={`/chat?rideId=${rideId}&otherUserId=${p.passengerId}`}>
                    <MessageCircle className="size-3.5" />
                    Message
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: 'brand' | 'warn';
}

function StatTile({ icon, label, value, accent }: StatTileProps) {
  const valueClass = accent === 'brand' ? 'text-brand-300' : accent === 'warn' ? 'text-amber-300' : 'text-white';
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-3 min-w-0">
      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase tracking-wider">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <p className={`mt-1 font-display font-bold text-base truncate ${valueClass}`}>{value}</p>
    </div>
  );
}
