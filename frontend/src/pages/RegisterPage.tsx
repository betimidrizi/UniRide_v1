import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, GraduationCap, Phone, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuroraBackground } from '@/components/AuroraBackground';
import { Logo } from '@/components/Logo';
import { TextField } from '@/components/ui/TextField';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { extractError } from '@/api/client';

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    try {
      const res = await authApi.register({
        fullName: String(data.get('fullName') ?? '').trim(),
        email: String(data.get('email') ?? '').trim(),
        password: String(data.get('password') ?? ''),
        university: String(data.get('university') ?? '').trim(),
        phoneNumber: (String(data.get('phoneNumber') ?? '').trim() || undefined) as string | undefined
      });
      setSession(res);
      toast.success(`Welcome aboard, ${res.fullName.split(' ')[0]}.`);
      navigate('/rides', { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const passwordChecks = [
    { ok: password.length >= 8, label: '8+ characters' },
    { ok: /[A-Z]/.test(password), label: 'Uppercase letter' },
    { ok: /[a-z]/.test(password), label: 'Lowercase letter' },
    { ok: /[0-9]/.test(password), label: 'Number' }
  ];

  return (
    <AuroraBackground variant="full">
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between p-12 relative">
          <Logo size={44} />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6 max-w-md"
          >
            <h1 className="font-display text-5xl xl:text-6xl font-extrabold leading-[1.05]">
              Empty seats are
              <br />
              <span className="gradient-text">wasted miles.</span>
            </h1>
            <p className="text-lg text-slate-400">
              Join thousands of students who share rides to campus every day. Sign up in under a minute.
            </p>
          </motion.div>

          <p className="text-xs text-slate-500">© {new Date().getFullYear()} UniRide.</p>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass w-full max-w-md p-8 sm:p-10"
          >
            <div className="lg:hidden mb-6">
              <Logo />
            </div>

            <h2 className="font-display text-2xl font-extrabold text-white mb-1">Create your account</h2>
            <p className="text-slate-400 text-sm mb-7">Takes less than a minute. No credit card needed.</p>

            <form onSubmit={submit} className="space-y-4">
              <TextField
                label="Full name"
                name="fullName"
                placeholder="Maya Rodriguez"
                icon={<User className="size-4" />}
                required
                autoComplete="name"
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                placeholder="you@university.edu"
                icon={<Mail className="size-4" />}
                required
                autoComplete="email"
              />
              <div>
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  icon={<Lock className="size-4" />}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 grid grid-cols-2 gap-1.5"
                  >
                    {passwordChecks.map((c) => (
                      <div
                        key={c.label}
                        className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-emerald-300' : 'text-slate-500'}`}
                      >
                        <Check className={`size-3 ${c.ok ? '' : 'opacity-40'}`} />
                        {c.label}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
              <TextField
                label="University"
                name="university"
                placeholder="South East European University"
                icon={<GraduationCap className="size-4" />}
                required
              />
              <TextField
                label="Phone (optional)"
                name="phoneNumber"
                type="tel"
                inputMode="numeric"
                pattern="07[0-9]{7}"
                minLength={9}
                maxLength={9}
                placeholder="070123456"
                title="Use a Macedonian mobile number, for example 070123456."
                icon={<Phone className="size-4" />}
                autoComplete="tel"
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm"
                >
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button className="btn-primary w-full !py-3" disabled={submitting}>
                {submitting ? (
                  <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Create account
                  </>
                )}
              </button>
            </form>

            <p className="text-sm text-slate-400 mt-6 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-300 hover:text-brand-200 font-medium underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </AuroraBackground>
  );
}
