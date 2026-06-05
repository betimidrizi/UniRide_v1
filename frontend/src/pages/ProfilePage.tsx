import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, GraduationCap, Mail, Phone, Save, ShieldCheck, Star, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { TextField } from '@/components/ui/TextField';
import { usersApi } from '@/api/users';
import { extractError } from '@/api/client';
import { motion } from 'framer-motion';

export function ProfilePage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: usersApi.me
  });

  const mutate = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated.');
      setEditing(false);
    },
    onError: (err) => toast.error(extractError(err))
  });

  const requestVerification = useMutation({
    mutationFn: usersApi.requestVerification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Verification request sent.');
    },
    onError: (err) => toast.error(extractError(err))
  });

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await mutate.mutateAsync({
      fullName: String(f.get('fullName') ?? '').trim(),
      university: String(f.get('university') ?? '').trim(),
      phoneNumber: (String(f.get('phoneNumber') ?? '').trim() || undefined) as string | undefined
    });
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" subtitle="Your UniRide identity." />

      {isLoading || !profile ? (
        <Skeleton className="h-72 max-w-2xl" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 max-w-2xl"
        >
          <div className="flex items-start gap-5 mb-8">
            <Avatar name={profile.fullName} size={80} />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold text-white">{profile.fullName}</h2>
              <p className="text-slate-400 text-sm">{profile.email}</p>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="chip-completed">{profile.role}</span>
                <span className={profile.isVerified ? 'chip-open' : 'chip-pending'}>
                  {profile.isVerified ? (
                    <><BadgeCheck className="size-3" /> Verified</>
                  ) : profile.verificationRequestedAt ? (
                    'Verification pending'
                  ) : (
                    'Not verified'
                  )}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <Star className="size-3.5 fill-amber-300" />
                  {profile.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {!editing ? (
            <>
              <dl className="space-y-4">
                <Row icon={<User className="size-4" />} label="Full name" value={profile.fullName} />
                <Row icon={<Mail className="size-4" />} label="Email" value={profile.email} />
                <Row icon={<GraduationCap className="size-4" />} label="University" value={profile.university} />
                <Row icon={<Phone className="size-4" />} label="Phone" value={profile.phoneNumber || 'Not added'} />
              </dl>
              <div className="mt-8 flex flex-wrap justify-end gap-2">
                {!profile.isVerified && !profile.verificationRequestedAt && (
                  <button
                    className="btn-secondary"
                    onClick={() => requestVerification.mutate()}
                    disabled={requestVerification.isPending}
                  >
                    <ShieldCheck className="size-4" />
                    Request verification
                  </button>
                )}
                <button className="btn-primary" onClick={() => setEditing(true)}>
                  Edit profile
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <TextField
                label="Full name"
                name="fullName"
                defaultValue={profile.fullName}
                icon={<User className="size-4" />}
                required
              />
              <TextField
                label="University"
                name="university"
                defaultValue={profile.university}
                icon={<GraduationCap className="size-4" />}
                required
              />
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
                defaultValue={profile.phoneNumber ?? ''}
                icon={<Phone className="size-4" />}
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button className="btn-primary" disabled={mutate.isPending}>
                  <Save className="size-4" />
                  Save
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}
    </>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="grid place-items-center size-9 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-sm text-white truncate">{value}</p>
      </div>
    </div>
  );
}
