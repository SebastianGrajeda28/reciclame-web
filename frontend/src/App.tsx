declare global {
  interface Window {
    __forceSessionExpired?: () => void;
  }
}
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ui/theme-provider';
import { UserProvider } from './shared/context/UserContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import TitleSetter from './shared/components/TittleSetter';
import Header from './shared/components/Header';
import Footer from './shared/components/Footer';
import SessionExpiredModal from './shared/modals/SessionExpiredModal';
import { Toaster } from 'sonner';

import Home from './shared/pages/Home';
import Login from './shared/pages/Login';
import Logout from './shared/pages/Logout';
import AuthCallback from './shared/pages/AuthCallback';
import AdminPanel from './shared/pages/AdminPanel';
import ManagerPanel from './shared/pages/ManagerPanel';
import ViewerPanel from './shared/pages/ViewerPanel';
import UsersPage from './modules/admin/pages/UsersPage';
import AdminConfigPage from './modules/admin/pages/AdminConfigPage';
import ForgotPassword from './shared/pages/ForgotPassword';
import ResetPassword from './shared/pages/ResetPassword';
import AccessDenied from './shared/pages/AccessDenied';

export default function App() {
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    window.__forceSessionExpired = () => setSessionExpired(true);
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <UserProvider>
        <div className="flex flex-col min-h-screen">
          <SessionExpiredModal open={sessionExpired} />
          <Router>
            <TitleSetter />
            <Header />
            <main className="flex-1 dark:bg-gray-900 pt-20">
              <Routes>

                {/* ── Rutas públicas ── */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* ── VIEWER ── */}
                <Route element={<ProtectedRoute allowedRoles={['VIEWER']} />}>
                  <Route path="/viewer" element={<ViewerPanel />} />
                </Route>

                {/* ── MANAGER ── */}
                <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']} />}>
                  <Route path="/manager" element={<ManagerPanel />} />
                </Route>

                {/* ── ADMIN ── */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/admin/accounts" element={<UsersPage />} />
                  <Route path="/admin/config" element={<AdminConfigPage />} />
                </Route>

                <Route path="/unauthorized" element={<AccessDenied />} />
                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
            </main>
            <Footer />
          </Router>
        </div>
        <Toaster richColors />
      </UserProvider>
    </ThemeProvider>
  );
}
