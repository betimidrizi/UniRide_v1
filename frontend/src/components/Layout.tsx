import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  Car,
  Compass,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PlusCircle,
  Flag,
  Sparkles,
  Ticket,
  UserCircle2,
  ShieldCheck
} from 'lucide-react';
import { Logo } from './Logo';
import { Avatar } from './ui/Avatar';
import { AuroraBackground } from './AuroraBackground';
import { NotificationBell } from './NotificationBell';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat';
import { resetChatConnection } from '@/api/realtime';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Compass;
  badge?: number;
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const qc = useQueryClient();

  // Scroll back to top on every route change — React Router doesn't restore
  // scroll by default, so without this we keep the previous page's scroll
  // position (e.g. coming back from the bottom of a chat).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const { data: unread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: chatApi.unreadCount,
    refetchInterval: 20_000
  });

  const isAdmin = user?.role === 'Admin';

  const items: NavItem[] = isAdmin
    ? [
        { to: '/admin', label: 'Overview', icon: LayoutDashboard },
        { to: '/admin/users', label: 'Users', icon: UserCircle2 },
        { to: '/admin/rides', label: 'Rides', icon: Car },
        { to: '/admin/reports', label: 'Reports', icon: Flag }
      ]
    : [
        { to: '/rides', label: 'Find a ride', icon: Compass },
        { to: '/rides/new', label: 'Offer a ride', icon: PlusCircle },
        { to: '/my-rides', label: 'My rides', icon: Car },
        { to: '/reservations', label: 'Reservations', icon: Ticket },
        { to: '/chat', label: 'Messages', icon: MessageCircle, badge: unread },
        { to: '/profile', label: 'Profile', icon: UserCircle2 }
      ];

  function logout() {
    if (refreshToken) {
      // Fire-and-forget — server-side revoke
      import('@/api/auth').then(({ authApi }) => authApi.revoke(refreshToken).catch(() => {}));
    }
    resetChatConnection().catch(() => undefined);
    qc.cancelQueries();
    qc.clear();
    clear();
    navigate('/login', { replace: true });
  }

  return (
    <AuroraBackground variant="full">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-screen">
        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-2 p-5 border-r border-white/5 backdrop-blur-xl bg-ink-950/40">
          <div className="px-2 pt-2 pb-6">
            <Logo />
          </div>

          {isAdmin && (
            <div className="mb-2 mx-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 text-[11px] font-semibold tracking-wider uppercase w-fit">
              <ShieldCheck className="size-3" />
              Admin console
            </div>
          )}

          <nav className="flex flex-col gap-1 mt-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                    isActive
                      ? 'bg-white/[0.07] text-white shadow-inner-glow'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-brand-500/15 via-fuchsia-500/10 to-transparent border border-white/10"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <item.icon className="size-[18px] shrink-0" />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold bg-fuchsia-500 text-white">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto" />

          <div className="glass p-3 flex items-center gap-3">
            <Avatar name={user?.name || 'You'} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="btn-ghost size-9 !p-0 grid place-items-center" title="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        </aside>

        {/* ── Mobile top bar ────────────────────────────────────────────── */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-ink-950/60 backdrop-blur-xl sticky top-0 z-30">
          <Logo size={32} />
          <div className="flex items-center gap-2">
            {!isAdmin && <NotificationBell />}
            <Avatar name={user?.name || 'You'} size={32} />
            <button onClick={logout} className="btn-ghost size-9 !p-0 grid place-items-center" title="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        {/* ── Workspace ────────────────────────────────────────────────── */}
        <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 overflow-x-hidden">
          {/* Desktop top-right corner: notification bell */}
          {!isAdmin && (
            <div className="hidden lg:flex items-center justify-end gap-2 mb-2 -mt-2">
              <NotificationBell />
            </div>
          )}

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-30 glass p-1.5 grid grid-cols-5 gap-1">
            {items.slice(0, 5).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-colors',
                    isActive ? 'text-white bg-white/10' : 'text-slate-400'
                  )
                }
              >
                <item.icon className="size-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.badge ? (
                  <span className="absolute top-1 right-2 size-2 rounded-full bg-fuchsia-500" />
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="h-20 lg:hidden" aria-hidden />
        </main>
      </div>

      {/* Ambient sparkle pinned to corner */}
      <Sparkles className="hidden lg:block fixed bottom-6 right-6 size-4 text-brand-400/40 animate-float-slow" />
    </AuroraBackground>
  );
}
