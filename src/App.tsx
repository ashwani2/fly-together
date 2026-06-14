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
const AdminAgents = lazy(() => import('./screens/AdminAgents'));
const AdminLogin = lazy(() => import('./screens/AdminLogin'));
const AgentLogin = lazy(() => import('./screens/AgentLogin'));
const ResetPassword = lazy(() => import('./screens/ResetPassword'));
const AdminAccommodations = lazy(() => import('./screens/AdminAccommodations'));
const AdminPartners = lazy(() => import('./screens/AdminPartners'));
const AdminUniversities = lazy(() => import('./screens/AdminUniversities'));
const AdminLoans = lazy(() => import('./screens/AdminLoans'));
const AdminTestimonials = lazy(() => import('./screens/AdminTestimonials'));
const AdminBlogs = lazy(() => import('./screens/AdminBlogs'));
const AdminHomePartners = lazy(() => import('./screens/AdminHomePartners'));
const Blog = lazy(() => import('./screens/Blog'));
const SearchResults = lazy(() => import('./screens/SearchResults'));
const Agent = lazy(() => import('./screens/Agent'));

import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import { SwalHost } from './lib/swal';
import { ToastHost } from './lib/toast';
import { LoadingScreen } from './components/LoadingScreen';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'student' | 'admin' | 'agent' }) {
  const { user, role: userRole, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" />;
  
  if (!role && userRole === 'admin' && !pathname.includes('/admin')) {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (!role && userRole === 'agent' && !pathname.includes('/agent')) {
    return <Navigate to="/dashboard/agent" replace />;
  }
  
  if (role && userRole !== role) {
    if (userRole === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (userRole === 'agent') return <Navigate to="/dashboard/agent" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SwalHost />
        <ToastHost />
        <Router>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/agent-login" element={<AgentLogin />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/search" element={<SearchResults />} />
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
                <Route path="admin/agents" element={<ProtectedRoute role="admin"><AdminAgents /></ProtectedRoute>} />
                <Route path="admin/loans" element={<ProtectedRoute role="admin"><AdminLoans /></ProtectedRoute>} />
                <Route path="admin/testimonials" element={<ProtectedRoute role="admin"><AdminTestimonials /></ProtectedRoute>} />
                <Route path="admin/blogs" element={<ProtectedRoute role="admin"><AdminBlogs /></ProtectedRoute>} />
                <Route path="admin/home-partners" element={<ProtectedRoute role="admin"><AdminHomePartners /></ProtectedRoute>} />
                <Route path="admin/universities" element={<ProtectedRoute role="admin"><AdminUniversities /></ProtectedRoute>} />
                <Route path="admin/accommodations" element={<ProtectedRoute role="admin"><AdminAccommodations /></ProtectedRoute>} />
                <Route path="admin/partners" element={<ProtectedRoute role="admin"><AdminPartners /></ProtectedRoute>} />
                <Route path="agent" element={<ProtectedRoute role="agent"><Agent /></ProtectedRoute>} />
                <Route path="agent/verifications" element={<ProtectedRoute role="agent"><Agent /></ProtectedRoute>} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

