import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuroraBackground } from '@/components/AuroraBackground';
import { Logo } from '@/components/Logo';
import { TextField } from '@/components/ui/TextField';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { extractError } from '@/api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from ?? '/rides';
  const safeFrom = from.startsWith('/chat') || from.startsWith('/admin') ? '/rides' : from;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    try {
      const res = await authApi.login({
        email: String(data.get('email') ?? ''),
        password: String(data.get('password') ?? '')
      });
      setSession(res);
      toast.success(`Welcome back, ${res.fullName.split(' ')[0]}.`);
      navigate(res.role === 'Admin' ? '/admin' : safeFrom, { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuroraBackground variant="full">
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
          <Logo size={44} />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6 max-w-md"
          >
            <h1 className="font-display text-5xl xl:text-6xl font-extrabold leading-[1.05]">
              Share the road,
              <br />
              <span className="gradient-text">split the cost.</span>
            </h1>
            <p className="text-lg text-slate-400">
              A modern carpool platform built for university students. Find a ride to class,
              fill the empty seats in your car, and chat along the way.
            </p>

            <div className="flex flex-wrap gap-2">
              {['Real-time chat', 'Verified students', 'Fair pricing', 'Zero clutter'].map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-200"
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <p className="text-xs text-slate-500">© {new Date().getFullYear()} UniRide — built with care.</p>
        </div>

        {/* Right form */}
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

            <h2 className="font-display text-2xl font-extrabold text-white mb-1">Welcome back</h2>
            <p className="text-slate-400 text-sm mb-7">Sign in to manage rides, reservations, and messages.</p>

            <form onSubmit={submit} className="space-y-4" autoComplete="on">
              <TextField
                label="Email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@university.edu"
                icon={<Mail className="size-4" />}
                required
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                icon={<Lock className="size-4" />}
                required
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
                    <LogIn className="size-4" />
                    Sign in
                  </>
                )}
              </button>
            </form>

            <p className="text-sm text-slate-400 mt-6 text-center">
              New to UniRide?{' '}
              <Link to="/register" className="text-brand-300 hover:text-brand-200 font-medium underline-offset-4 hover:underline">
                Create an account
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </AuroraBackground>
  );
}
