import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';

const LandingPage = lazy(() => import('./screens/LandingPage'));
const Dashboard = lazy(() => import('./screens/Dashboard'));
const Profile = lazy(() => import('./screens/Profile'));
const Universities = lazy(() => import('./screens/Universities'));
const Marketplace = lazy(() => import('./screens/Marketplace'));
const Accommodation = lazy(() => import('./screens/Accommodation'));
const Services = lazy(() => import('./screens/Services'));
const LoanApplication = lazy(() => import('./screens/LoanApplication'));
const Applications = lazy(() => import('./screens/Applications'));
const Admin = lazy(() => import('./screens/Admin'));
const AdminLogin = lazy(() => import('./screens/AdminLogin'));
const AdminAccommodations = lazy(() => import('./screens/AdminAccommodations'));
const AdminPartners = lazy(() => import('./screens/AdminPartners'));
const AdminUniversities = lazy(() => import('./screens/AdminUniversities'));
const Blog = lazy(() => import('./screens/Blog'));

import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'student' | 'admin' }) {
  const { user, role: userRole, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  
  if (!role && userRole === 'admin' && !pathname.includes('/admin')) {
    return <Navigate to="/dashboard/admin" replace />;
  }
  
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
          <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading...</div>}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="services" element={<Services />} />
                <Route path="loan-application" element={<LoanApplication />} />
                <Route path="accommodation" element={<Accommodation />} />
                <Route path="applications" element={<Applications />} />
                <Route path="market" element={<Marketplace />} />
                <Route path="uni" element={<Universities />} />
                <Route path="admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
                <Route path="admin/universities" element={<ProtectedRoute role="admin"><AdminUniversities /></ProtectedRoute>} />
                <Route path="admin/accommodations" element={<ProtectedRoute role="admin"><AdminAccommodations /></ProtectedRoute>} />
                <Route path="admin/partners" element={<ProtectedRoute role="admin"><AdminPartners /></ProtectedRoute>} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

