import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layouts
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import VerifyPrnPage from './pages/auth/VerifyPrnPage';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/auth/LoginPage';

// App pages
import DashboardPage from './pages/DashboardPage';
import DirectoryPage from './pages/DirectoryPage';
import UserProfilePage from './pages/UserProfilePage';
import JobBoardPage from './pages/JobBoardPage';
import JobDetailPage from './pages/JobDetailPage';
import PostJobPage from './pages/PostJobPage';
import QuizzesPage from './pages/QuizzesPage';
import QuizAttemptPage from './pages/QuizAttemptPage';
import WalletPage from './pages/WalletPage';
import ReferralsPage from './pages/ReferralsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => { hydrate(); }, [hydrate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<VerifyPrnPage />} />
        <Route path="/register/complete" element={<RegisterPage />} />
      </Route>

      {/* App routes (require login) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"  element={<DashboardPage />} />
        <Route path="/directory"  element={<DirectoryPage />} />
        <Route path="/users/:id"  element={<UserProfilePage />} />

        {/* Jobs */}
        <Route path="/jobs"       element={<JobBoardPage />} />
        <Route path="/jobs/:id"   element={<JobDetailPage />} />
        <Route path="/jobs/new"   element={
          <RoleRoute roles={['alumni', 'admin']}><PostJobPage /></RoleRoute>
        } />

        {/* Quizzes */}
        <Route path="/quizzes"        element={<QuizzesPage />} />
        <Route path="/quizzes/:id"    element={<QuizAttemptPage />} />

        {/* Referrals & Wallet */}
        <Route path="/referrals"  element={<ReferralsPage />} />
        <Route path="/wallet"     element={<WalletPage />} />

        {/* Settings */}
        <Route path="/settings"   element={<SettingsPage />} />

        {/* Admin */}
        <Route path="/admin/*"    element={
          <RoleRoute roles={['admin']}><AdminPage /></RoleRoute>
        } />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
