import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { ThemeProvider } from './lib/ThemeContext';

import AdminAccommodations from './screens/AdminAccommodations';
import AdminPartners from './screens/AdminPartners';
import AdminUniversities from './screens/AdminUniversities';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'student' | 'admin' }) {
  const { user, role: userRole, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  
  // If no specific role is required (general dashboard layout), but user is admin and not already on an admin path
  if (!role && userRole === 'admin' && !pathname.includes('/admin')) {
    return <Navigate to="/dashboard/admin" replace />;
  }
  
  // Strict role check
  if (role && userRole !== role) {
    return <Navigate to={userRole === 'admin' ? "/dashboard/admin" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
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
              <Route path="market" element={<Marketplace />} />
              <Route path="uni" element={<Universities />} />
              {/* Admin only routes */}
              <Route path="admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
              <Route path="admin/universities" element={<ProtectedRoute role="admin"><AdminUniversities /></ProtectedRoute>} />
              <Route path="admin/accommodations" element={<ProtectedRoute role="admin"><AdminAccommodations /></ProtectedRoute>} />
              <Route path="admin/partners" element={<ProtectedRoute role="admin"><AdminPartners /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
