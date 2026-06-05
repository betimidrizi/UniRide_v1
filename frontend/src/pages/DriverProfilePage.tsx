import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, Star, UserX, MessageSquareQuote, Compass } from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Skeleton } from '@/components/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { RideCard } from '@/components/RideCard';
import { ridesApi } from '@/api/rides';
import { reviewsApi } from '@/api/reviews';
import { formatDateTime } from '@/lib/utils';
import type { Ride } from '@/types';

type TabKey = 'rides' | 'reviews';

export function DriverProfilePage() {
  const { driverId } = useParams<{ driverId: string }>();
  const id = Number(driverId);
  const [tab, setTab] = useState<TabKey>('rides');

  const { data: search, isLoading: ridesLoading } = useQuery({
    queryKey: ['driver', id, 'rides'],
    queryFn: () => ridesApi.search({ page: 1, pageSize: 100 }),
    enabled: Number.isFinite(id) && id > 0
  });

  const driverRides: Ride[] = useMemo(
    () => (search?.items ?? []).filter((r) => r.driverId === id),
    [search, id]
  );

  const first = driverRides[0];

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['driver', id, 'reviews'],
    queryFn: () => reviewsApi.forUser(id),
    enabled: Number.isFinite(id) && id > 0
  });

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <EmptyState
        icon={<UserX />}
        title="Invalid driver link"
        description="That profile id doesn't look right."
      />
    );
  }

  if (ridesLoading) {
    return (
      <>
        <Skeleton className="h-12 w-1/2 mb-6" />
        <Skeleton className="h-48 mb-4" />
        <Skeleton className="h-64" />
      </>
    );
  }

  const displayName = first?.driverName || `Driver #${id}`;
  const university = first?.university;

  return (
    <>
      <PageHeader eyebrow="Profile" title="Driver" subtitle={displayName} />

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-7 mb-6 relative overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
        <div className="absolute -top-20 -right-20 size-56 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5">
          <Avatar name={displayName} size={84} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white truncate">
              {displayName}
            </h2>
            {university && (
              <p className="text-slate-400 text-sm mt-1 inline-flex items-center gap-1.5">
                <GraduationCap className="size-4" />
                {university}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Star className="size-3.5 fill-amber-300" />
                {averageRating !== null ? averageRating.toFixed(1) : '—'}
              </span>
              <span className="text-slate-500">
                {reviews?.length ?? 0} review{reviews?.length === 1 ? '' : 's'}
              </span>
              <span className="text-slate-500">
                {driverRides.length} ride{driverRides.length === 1 ? '' : 's'} listed
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Tabs */}
      <div className="mb-5 flex items-center gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-2xl w-fit">
        <TabButton active={tab === 'rides'} onClick={() => setTab('rides')} label={`Rides (${driverRides.length})`} />
        <TabButton active={tab === 'reviews'} onClick={() => setTab('reviews')} label={`Reviews (${reviews?.length ?? 0})`} />
      </div>

      {tab === 'rides' ? (
        driverRides.length === 0 ? (
          <EmptyState
            icon={<Compass />}
            title="No rides listed yet"
            description="This driver hasn't published any rides we can see right now."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {driverRides.map((ride, i) => (
              <RideCard key={ride.rideId} ride={ride} index={i}>
                <Link to={`/rides/${ride.rideId}`} className="btn-secondary">
                  View details
                </Link>
              </RideCard>
            ))}
          </div>
        )
      ) : reviewsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote />}
          title="No reviews yet"
          description="Reviews will appear here after riders complete trips with this driver."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <motion.article
              key={r.reviewId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass p-5"
            >
              <header className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Avatar name={r.reviewerName || `Rider ${r.reviewerId}`} size={36} />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {r.reviewerName || `Rider #${r.reviewerId}`}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-0.5 text-amber-300">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`size-4 ${idx < r.rating ? 'fill-amber-300' : 'text-slate-600'}`}
                    />
                  ))}
                </div>
              </header>
              {r.comment && <p className="text-sm text-slate-200 leading-relaxed">{r.comment}</p>}
            </motion.article>
          ))}
        </div>
      )}
    </>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function TabButton({ active, onClick, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-fuchsia-500 text-white shadow-lg shadow-brand-500/20'
          : 'px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors'
      }
    >
      {label}
    </button>
  );
}
