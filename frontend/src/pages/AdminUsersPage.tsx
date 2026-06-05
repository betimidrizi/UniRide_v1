import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Ban, Pencil, RotateCcw, Search, ShieldCheck, Trash2, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Skeleton } from '@/components/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { TextField, Select } from '@/components/ui/TextField';
import { useConfirm } from '@/components/ui/Dialog';
import { adminApi, type AdminUpdatePayload } from '@/api/admin';
import { extractError } from '@/api/client';
import type { AdminUser } from '@/types';

export function AdminUsersPage() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.users
  });

  const suspend = useMutation({
    mutationFn: adminApi.suspend,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('User suspended.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const restore = useMutation({
    mutationFn: adminApi.restore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('User restored.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const verify = useMutation({
    mutationFn: adminApi.verify,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User verified.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const unverify = useMutation({
    mutationFn: adminApi.unverify,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Verification removed.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const remove = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('User deleted.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AdminUpdatePayload }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User updated.');
      setEditing(null);
    },
    onError: (err) => toast.error(extractError(err))
  });

  const filtered = (users ?? []).filter((u) =>
    `${u.fullName} ${u.email} ${u.university} ${u.role}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader eyebrow="Admin" title="Users" subtitle="Moderate the community." />

      <div className="mb-4 max-w-sm">
        <TextField
          icon={<Search className="size-4" />}
          placeholder="Search by name, email, university…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {editing && (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            update.mutate({
              id: editing.userId,
              payload: {
                fullName: String(f.get('fullName') ?? '').trim(),
                email: String(f.get('email') ?? '').trim(),
                university: String(f.get('university') ?? '').trim(),
                phoneNumber: (String(f.get('phoneNumber') ?? '').trim() || undefined) as string | undefined,
                role: String(f.get('role') ?? 'Student'),
                isSuspended: f.get('isSuspended') === 'on'
              }
            });
          }}
          className="glass p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <TextField label="Full name" name="fullName" defaultValue={editing.fullName} required />
          <TextField label="Email" name="email" type="email" defaultValue={editing.email} required />
          <TextField label="University" name="university" defaultValue={editing.university} required />
          <TextField
            label="Phone"
            name="phoneNumber"
            type="tel"
            inputMode="numeric"
            pattern="07[0-9]{7}"
            minLength={9}
            maxLength={9}
            placeholder="070123456"
            title="Use a Macedonian mobile number, for example 070123456."
            defaultValue={editing.phoneNumber ?? ''}
          />
          <Select
            label="Role"
            name="role"
            defaultValue={editing.role}
            options={[
              { value: 'Student', label: 'Student' },
              { value: 'Driver', label: 'Driver' },
              { value: 'Admin', label: 'Admin' }
            ]}
          />
          <label className="flex items-center gap-3 self-end px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 cursor-pointer">
            <input type="checkbox" name="isSuspended" defaultChecked={editing.isSuspended} className="accent-fuchsia-500" />
            <span className="text-sm text-white">Suspended</span>
          </label>
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" disabled={update.isPending}>Save user</button>
          </div>
        </motion.form>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<UsersIcon />} title="No users match your search." />
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => (
            <motion.div
              key={u.userId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.2) }}
              className="glass glass-hover p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <Avatar name={u.fullName} size={44} />
              <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <p className="text-sm text-slate-300 truncate">{u.university}</p>
                <div className="flex items-center gap-2">
                  <span className={u.isSuspended ? 'chip-cancelled' : 'chip-completed'}>{u.role}</span>
                  {u.isVerified ? (
                    <span className="chip-open"><BadgeCheck className="size-3" /> Verified</span>
                  ) : u.verificationRequestedAt ? (
                    <span className="chip-pending">Verification requested</span>
                  ) : null}
                  {u.isSuspended && <span className="chip-full">Suspended</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {u.isVerified ? (
                  <button className="btn-secondary !px-3" onClick={() => unverify.mutate(u.userId)}>
                    <ShieldCheck className="size-3.5" /> Unverify
                  </button>
                ) : (
                  <button className="btn-secondary !px-3" onClick={() => verify.mutate(u.userId)}>
                    <ShieldCheck className="size-3.5" /> Verify
                  </button>
                )}
                <button className="btn-secondary !px-3" onClick={() => setEditing(u)}>
                  <Pencil className="size-3.5" /> Edit
                </button>
                {u.isSuspended ? (
                  <button className="btn-secondary !px-3" onClick={() => restore.mutate(u.userId)}>
                    <RotateCcw className="size-3.5" /> Restore
                  </button>
                ) : (
                  <button className="btn-danger !px-3" onClick={() => suspend.mutate(u.userId)}>
                    <Ban className="size-3.5" /> Suspend
                  </button>
                )}
                <button
                  className="btn-danger !px-3"
                  onClick={async () => {
                    const ok = await confirm('Permanently delete this user?', {
                      description: `Deletes ${u.fullName} and all their rides, reservations, messages, reviews, and notifications.`,
                      confirmLabel: 'Delete user',
                      variant: 'danger'
                    });
                    if (ok) remove.mutate(u.userId);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {dialog}
    </>
  );
}
