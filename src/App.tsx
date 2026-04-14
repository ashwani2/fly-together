import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import LandingPage from "./screens/LandingPage";
import Dashboard from "./screens/Dashboard";
import Profile from "./screens/Profile";
import Universities from "./screens/Universities";
import Marketplace from "./screens/Marketplace";
import Accommodation from "./screens/Accommodation";
import Applications from "./screens/Applications";
import Admin from "./screens/Admin";
import AdminLogin from "./screens/AdminLogin";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="accommodation" element={<Accommodation />} />
          <Route path="applications" element={<Applications />} />
          {/* Admin only routes */}
          <Route path="universities" element={<Universities />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  );
}
