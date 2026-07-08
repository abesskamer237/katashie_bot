import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Pages publiques
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ForgotPasswordPage } from './pages/ForgotPassword';

// Pages utilisateur
import { DashboardPage } from './pages/Dashboard';
import { ServersPage } from './pages/Servers';
import { ServerDetailPage } from './pages/ServerDetail';
import { CreateServerPage } from './pages/CreateServer';
import { CreditsPage } from './pages/Credits';
import { ProfilePage } from './pages/Profile';

// Pages admin
import { AdminDashboardPage } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsers';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetail';
import { AdminPaymentsPage } from './pages/admin/AdminPayments';
import { AdminServersPage } from './pages/admin/AdminServers';
import { AdminPacksPage } from './pages/admin/AdminPacks';
import { AdminLogsPage } from './pages/admin/AdminLogs';
import { AdminNotificationsPage } from './pages/admin/AdminNotifications';

// Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <div className="scanline">
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

          {/* User — Protected */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/servers" element={<ServersPage />} />
            <Route path="/servers/create" element={<CreateServerPage />} />
            <Route path="/servers/:id" element={<ServerDetailPage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Admin — Protected + Admin role */}
          <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/servers" element={<AdminServersPage />} />
            <Route path="/admin/packs" element={<AdminPacksPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />
            <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
