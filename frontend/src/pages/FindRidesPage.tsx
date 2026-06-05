import { useMemo, type FormEvent } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, GraduationCap, Users, ArrowUpDown, Compass, Plus, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/PageHeader';
import { RideCard } from '@/components/RideCard';
import { EmptyState, Skeleton } from '@/components/EmptyState';
import { TextField, Select } from '@/components/ui/TextField';
import { ridesApi } from '@/api/rides';
import { reservationsApi } from '@/api/reservations';
import { extractError } from '@/api/client';
import type { PagedResult, Ride, RideSearchParams } from '@/types';

const FILTER_KEYS = ['location', 'university', 'minSeats', 'sortBy', 'page'] as const;

function paramsFromQuery(sp: URLSearchParams): RideSearchParams {
  return {
    location: sp.get('location') || undefined,
    university: sp.get('university') || undefined,
    minSeats: sp.get('minSeats') ? Number(sp.get('minSeats')) : undefined,
    sortBy: (sp.get('sortBy') as RideSearchParams['sortBy']) || 'departure',
    page: Number(sp.get('page')) || 1,
    pageSize: 12
  };
}

export function FindRidesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => paramsFromQuery(searchParams), [searchParams]);
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['rides', filters],
    queryFn: () => ridesApi.search(filters),
    placeholderData: (prev) => prev
  });

  // Optimistic join — decrement availableSeats locally so the UI feels instant.
  const join = useMutation({
    mutationFn: reservationsApi.join,
    onMutate: async (rideId) => {
      await qc.cancelQueries({ queryKey: ['rides'] });
      const snapshot = qc.getQueriesData<PagedResult<Ride>>({ queryKey: ['rides'] });

      qc.setQueriesData<PagedResult<Ride>>({ queryKey: ['rides'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((r) =>
            r.rideId === rideId ? { ...r, availableSeats: Math.max(0, r.availableSeats - 1) } : r
          )
        };
      });

      return { snapshot };
    },
    onError: (err, _id, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData<PagedResult<Ride>>(key, data as PagedResult<Ride>));
      toast.error(extractError(err));
    },
    onSuccess: () => {
      toast.success('Seat request sent — waiting for the driver to approve.');
      qc.invalidateQueries({ queryKey: ['rides'] });
      qc.invalidateQueries({ queryKey: ['reservations', 'mine'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    }
  });

  function commit(next: Partial<RideSearchParams>) {
    const sp = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) sp.delete(k);
      else sp.set(k, String(v));
    });
    // Reset page when filters change (except page itself).
    if (!('page' in next)) sp.delete('page');
    setSearchParams(sp, { replace: false });
  }

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    commit({
      location: (f.get('location') as string) || undefined,
      university: (f.get('university') as string) || undefined,
      minSeats: Number(f.get('minSeats')) || undefined,
      sortBy: (f.get('sortBy') as RideSearchParams['sortBy']) || 'departure'
    });
  }

  function removeFilter(key: keyof RideSearchParams) {
    commit({ [key]: undefined } as Partial<RideSearchParams>);
  }

  function clearAll() {
    const sp = new URLSearchParams();
    setSearchParams(sp);
  }

  const activeChips = FILTER_KEYS
    .map((k) => {
      if (k === 'page') return null;
      const v = searchParams.get(k);
      if (!v) return null;
      if (k === 'sortBy' && v === 'departure') return null;
      return { key: k, label: chipLabel(k, v) };
    })
    .filter(Boolean) as { key: keyof RideSearchParams; label: string }[];

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="Find a ride"
        subtitle="Hop on a journey already in motion."
        description="Browse open rides from drivers heading your way. Reserve a seat and chat once you're confirmed."
        actions={
          <Link to="/rides/new" className="btn-primary">
            <Plus className="size-4" /> Offer a ride
          </Link>
        }
      />

      <div className="sticky top-0 lg:top-2 z-20 -mx-2 px-2 py-2 mb-4 bg-ink-950/40 backdrop-blur-xl rounded-2xl">
        <form onSubmit={search} className="glass p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <TextField
            name="location"
            label="From / To"
            placeholder="Skopje, Tetovo…"
            icon={<MapPin className="size-4" />}
            defaultValue={searchParams.get('location') ?? ''}
          />
          <TextField
            name="university"
            label="University"
            placeholder="SEEU…"
            icon={<GraduationCap className="size-4" />}
            defaultValue={searchParams.get('university') ?? ''}
          />
          <TextField
            name="minSeats"
            type="number"
            min={1}
            max={8}
            label="Min seats"
            icon={<Users className="size-4" />}
            placeholder="1"
            defaultValue={searchParams.get('minSeats') ?? ''}
          />
          <Select
            name="sortBy"
            label="Sort by"
            defaultValue={searchParams.get('sortBy') ?? 'departure'}
            options={[
              { value: 'departure', label: 'Departure time' },
              { value: 'price', label: 'Price' },
              { value: 'distance', label: 'Distance' }
            ]}
          />
          <button className="btn-primary !py-2.5">
            <Search className="size-4" /> Search
          </button>
        </form>

        {activeChips.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2 px-1">
            <span className="text-xs text-slate-300 uppercase tracking-wider">Filters:</span>
            {activeChips.map((c) => (
              <button
                key={c.key}
                onClick={() => removeFilter(c.key)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-brand-500/15 border border-brand-400/30 text-brand-200 hover:bg-brand-500/25 transition-colors"
              >
                {c.label}
                <X className="size-3" />
              </button>
            ))}
            <button onClick={clearAll} className="text-xs text-slate-300 hover:text-white underline-offset-4 hover:underline ml-1">
              Clear all
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Compass />}
          title="No rides match your filters."
          description="Try widening the location, lowering the minimum seats, or coming back closer to peak commute hours."
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 text-sm text-slate-300">
            <span>
              {data.total} ride{data.total === 1 ? '' : 's'} matching your criteria
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <ArrowUpDown className="size-3.5" />
              Page {data.page} / {data.totalPages || 1}
            </span>
          </div>
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.items.map((ride, i) => (
                <RideCard key={ride.rideId} ride={ride} index={i}>
                  <button
                    className="btn-primary"
                    disabled={ride.availableSeats <= 0 || ride.status !== 'Open' || join.isPending}
                    onClick={() => join.mutate(ride.rideId)}
                  >
                    Reserve seat
                  </button>
                </RideCard>
              ))}
            </div>
          </AnimatePresence>

          {(data.hasPrevious || data.hasNext) && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                className="btn-secondary"
                disabled={!data.hasPrevious || isFetching}
                onClick={() => commit({ page: (filters.page ?? 1) - 1 })}
              >
                Previous
              </button>
              <span className="px-3 text-sm text-slate-300">
                {data.page} / {data.totalPages || 1}
              </span>
              <button
                className="btn-secondary"
                disabled={!data.hasNext || isFetching}
                onClick={() => commit({ page: (filters.page ?? 1) + 1 })}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function chipLabel(key: string, value: string): string {
  switch (key) {
    case 'location': return `Location: ${value}`;
    case 'university': return `Uni: ${value}`;
    case 'minSeats': return `Min seats: ${value}`;
    case 'sortBy': return `Sort: ${value}`;
    default: return `${key}: ${value}`;
  }
}
