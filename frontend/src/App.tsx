import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { FindRidesPage } from '@/pages/FindRidesPage';
import { CreateRidePage } from '@/pages/CreateRidePage';
import { MyRidesPage } from '@/pages/MyRidesPage';
import { ReservationsPage } from '@/pages/ReservationsPage';
import { ChatPage } from '@/pages/ChatPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AdminOverviewPage } from '@/pages/AdminOverviewPage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { AdminRidesPage } from '@/pages/AdminRidesPage';
import { AdminReportsPage } from '@/pages/AdminReportsPage';
import { RideDetailPage } from '@/pages/RideDetailPage';
import { DriverProfilePage } from '@/pages/DriverProfilePage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useAuthStore } from '@/store/authStore';

export function App() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  const defaultRedirect = !token ? '/login' : user?.role === 'Admin' ? '/admin' : '/rides';

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student / Driver area */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/rides" element={<FindRidesPage />} />
          <Route path="/rides/new" element={<CreateRidePage />} />
          <Route path="/rides/:rideId" element={<RideDetailPage />} />
          <Route path="/drivers/:driverId" element={<DriverProfilePage />} />
          <Route path="/my-rides" element={<MyRidesPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin area */}
      <Route element={<ProtectedRoute requireRole="Admin" />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/rides" element={<AdminRidesPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={defaultRedirect} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
