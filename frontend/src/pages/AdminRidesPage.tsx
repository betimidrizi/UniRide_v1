import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Car } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Skeleton } from '@/components/EmptyState';
import { RideCard } from '@/components/RideCard';
import { TextField } from '@/components/ui/TextField';
import { useConfirm } from '@/components/ui/Dialog';
import { ridesApi } from '@/api/rides';
import { adminApi } from '@/api/admin';
import { extractError } from '@/api/client';

export function AdminRidesPage() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'rides'],
    queryFn: () => ridesApi.search({ page: 1, pageSize: 100, sortBy: 'departure', includeArchived: true })
  });

  const remove = useMutation({
    mutationFn: adminApi.forceDeleteRide,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'rides'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      qc.invalidateQueries({ queryKey: ['rides'] });
      toast.success('Ride force-deleted.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const filtered = (data?.items ?? []).filter((r) =>
    `${r.startLocation} ${r.destination} ${r.driverName} ${r.university} ${r.status}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader eyebrow="Admin" title="Rides" subtitle="Moderate active and archived routes." />

      <div className="mb-4 max-w-sm">
        <TextField
          icon={<Search className="size-4" />}
          placeholder="Search rides…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Car />} title="No rides match your search." />
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ride, i) => (
            <RideCard key={ride.rideId} ride={ride} index={i}>
              <button
                className="btn-danger"
                onClick={async () => {
                  const ok = await confirm('Force-delete this ride?', {
                    description: 'Reservations, messages, and reviews tied to this ride will be wiped. This cannot be undone.',
                    confirmLabel: 'Force delete',
                    variant: 'danger'
                  });
                  if (ok) remove.mutate(ride.rideId);
                }}
              >
                <Trash2 className="size-4" />
                Force delete
              </button>
            </RideCard>
          ))}
        </motion.div>
      )}
      {dialog}
    </>
  );
}
