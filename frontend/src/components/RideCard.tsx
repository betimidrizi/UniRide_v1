import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Sparkles, ArrowRight, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Avatar } from './ui/Avatar';
import { formatDateTime, formatPrice } from '@/lib/utils';
import type { Ride } from '@/types';
import type { ReactNode } from 'react';

function formatTimeOnly(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  ride: Ride;
  children?: ReactNode;
  /** Slight delay-staggered entrance when used in a grid. */
  index?: number;
  /** If true, wraps the card title in a Link to /rides/:id and hides the share button. */
  linkToDetail?: boolean;
}

export function RideCard({ ride, children, index = 0, linkToDetail = true }: Props) {
  const seatsLow = ride.availableSeats <= 1;

  async function shareLink(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/rides/${ride.rideId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2), ease: 'easeOut' }}
      className="glass glass-hover group relative overflow-hidden flex flex-col"
    >
      {/* Top gradient hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 flex flex-col gap-4 h-full">
        {/* Driver row */}
        <div className="flex items-center gap-3">
          <Avatar name={ride.driverName || `Driver ${ride.driverId}`} size={42} />
          <div className="min-w-0 flex-1">
            <Link
              to={`/drivers/${ride.driverId}`}
              className="text-sm font-semibold text-white truncate hover:text-brand-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {ride.driverName || `Driver #${ride.driverId}`}
            </Link>
            <p className="text-xs text-slate-300 truncate">{ride.university}</p>
          </div>
          <StatusChip status={ride.status} seatsLow={seatsLow} />
        </div>

        {/* Route + time */}
        <div className="relative">
          <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-brand-400 via-fuchsia-400 to-accent-400" />
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <span className="mt-1 grid place-items-center size-[15px] rounded-full bg-brand-500 shadow-[0_0_0_3px_rgba(139,92,246,0.25)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium leading-tight truncate">{ride.startLocation}</p>
                <p className="text-[11px] text-slate-300">Leaves at <span className="text-brand-300 font-medium">{formatTimeOnly(ride.departureTime)}</span></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 grid place-items-center size-[15px] rounded-full bg-accent-500 shadow-[0_0_0_3px_rgba(34,211,238,0.25)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium leading-tight truncate">{ride.destination}</p>
                <p className="text-[11px] text-slate-300">Arrives <span className="text-accent-400 font-medium">{ride.expectedArrivalTime ? formatTimeOnly(ride.expectedArrivalTime) : '—'}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-1">
          <Stat icon={<Calendar className="size-3.5" />} value={formatDateTime(ride.departureTime)} />
          <Stat icon={<Users className="size-3.5" />} value={`${ride.availableSeats} seat${ride.availableSeats === 1 ? '' : 's'}`} />
          <Stat icon={<MapPin className="size-3.5" />} value={`${ride.distanceKm} km`} />
        </div>

        {/* Price + action */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Per seat</p>
            <p className="text-xl font-bold text-white font-display">{formatPrice(ride.price)}</p>
          </div>
          <div className="flex items-center gap-2">
            {linkToDetail && (
              <>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={shareLink}
                  title="Copy ride link"
                  aria-label="Copy ride link"
                >
                  <Share2 className="size-4" />
                </button>
                <Link to={`/rides/${ride.rideId}`} className="btn-secondary" onClick={(e) => e.stopPropagation()}>
                  Details
                </Link>
              </>
            )}
            {children}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Stat({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-300 min-w-0">
      <span className="text-slate-500 shrink-0">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function StatusChip({ status, seatsLow }: { status: string; seatsLow: boolean }) {
  if (status === 'Open' && seatsLow)
    return (
      <span className="chip-open animate-pulse">
        <Sparkles className="size-3" /> Almost full
      </span>
    );
  if (status === 'Open') return <span className="chip-open"><span className="size-1.5 rounded-full bg-success-400 animate-pulse" /> Open</span>;
  if (status === 'Full') return <span className="chip-full">Full</span>;
  if (status === 'InProgress') return <span className="chip-in-progress"><Clock className="size-3" /> En route</span>;
  if (status === 'Cancelled') return <span className="chip-cancelled">Cancelled</span>;
  return <span className="chip-completed">{status}</span>;
}

interface CompactProps {
  ride: Ride;
  trailing?: ReactNode;
  onClick?: () => void;
}

export function CompactRideRow({ ride, trailing, onClick }: CompactProps) {
  return (
    <button
      onClick={onClick}
      className="glass glass-hover w-full p-4 flex items-center gap-3 text-left"
    >
      <Avatar name={ride.driverName} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate flex items-center gap-1.5">
          {ride.startLocation}
          <ArrowRight className="size-3.5 text-slate-500" />
          {ride.destination}
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-2">
          <Clock className="size-3" /> {formatDateTime(ride.departureTime)}
        </p>
      </div>
      {trailing}
    </button>
  );
}
