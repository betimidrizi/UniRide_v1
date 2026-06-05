import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';

interface Props {
  requireRole?: Role;
}

export function ProtectedRoute({ requireRole }: Props) {
  const location = useLocation();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    // Non-admins land on rides; admins on /admin
    return <Navigate to={user?.role === 'Admin' ? '/admin' : '/rides'} replace />;
  }

  return <Outlet />;
}
