import { useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, Car, MessageCircle, ShieldCheck, Ticket, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Skeleton } from '@/components/EmptyState';
import { adminApi } from '@/api/admin';

export function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.stats
  });

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Operations dashboard"
        subtitle="The pulse of the platform."
        description="Snapshot of users, rides, reservations, and messages across UniRide."
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Users" value={data.users} icon={<Users className="size-5" />} accent="brand" />
          <StatCard label="Active" value={data.activeUsers} icon={<Activity className="size-5" />} accent="emerald" />
          <StatCard label="Suspended" value={data.suspendedUsers} icon={<ShieldCheck className="size-5" />} accent="amber" />
          <StatCard label="Rides" value={data.rides} icon={<Car className="size-5" />} accent="accent" />
          <StatCard label="Reservations" value={data.reservations} icon={<Ticket className="size-5" />} accent="fuchsia" />
          <StatCard label="Messages" value={data.messages} icon={<MessageCircle className="size-5" />} accent="brand" />
          <StatCard label="Reviews" value={data.reviews} icon={<BarChart3 className="size-5" />} accent="accent" />
          <StatCard label="Notifications" value={data.notifications} icon={<Activity className="size-5" />} accent="emerald" />
        </div>
      )}
    </>
  );
}
