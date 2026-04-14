import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import LandingPage from './screens/LandingPage';
import Dashboard from './screens/Dashboard';
import Profile from './screens/Profile';
import Universities from './screens/Universities';
import Marketplace from './screens/Marketplace';
import Accommodation from './screens/Accommodation';
import Applications from './screens/Applications';
import Admin from './screens/Admin';
import AdminLogin from './screens/AdminLogin';
import { AuthProvider, useAuth } from './lib/AuthContext';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'student' | 'admin' }) {
  const { user, role: userRole, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (role && userRole !== role) return <Navigate to="/dashboard" />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="accommodation" element={<Accommodation />} />
            <Route path="applications" element={<Applications />} />
            {/* Admin only routes */}
            <Route path="universities" element={<ProtectedRoute role="admin"><Universities /></ProtectedRoute>} />
            <Route path="marketplace" element={<ProtectedRoute role="admin"><Marketplace /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
