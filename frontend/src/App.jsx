import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import WardenDashboard from './pages/warden/WardenDashboard';
import RoomAllocation from './pages/warden/RoomAllocation';
import LeaveRequests from './pages/warden/LeaveRequests';
import Complaints from './pages/warden/Complaints';
import TransportDashboard from './pages/transport/TransportDashboard';
import RouteManager from './pages/transport/RouteManager';
import LiveTracking from './pages/transport/LiveTracking';
import StudentDashboard from './pages/student/StudentDashboard';
import OutpassForm from './pages/student/OutpassForm';
import FeeStatus from './pages/student/FeeStatus';

// Layout wrapper for authenticated pages
const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Root index redirect based on role
const RootRedirect = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'warden') return <Navigate to="/warden/dashboard" replace />;
  if (role === 'driver') return <Navigate to="/transport/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes wrapped in AppLayout */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin', 'warden', 'driver', 'student']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Root index redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* Warden & Hostel Management Routes */}
            <Route
              path="/warden/dashboard"
              element={
                <ProtectedRoute allowedRoles={['warden', 'admin']}>
                  <WardenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/warden/rooms"
              element={
                <ProtectedRoute allowedRoles={['warden', 'admin']}>
                  <RoomAllocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/warden/leave-requests"
              element={
                <ProtectedRoute allowedRoles={['warden', 'admin']}>
                  <LeaveRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/warden/complaints"
              element={
                <ProtectedRoute allowedRoles={['warden', 'admin', 'student']}>
                  <Complaints />
                </ProtectedRoute>
              }
            />

            {/* Transport Management Routes */}
            <Route
              path="/transport/dashboard"
              element={
                <ProtectedRoute allowedRoles={['driver', 'admin']}>
                  <TransportDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport/routes"
              element={
                <ProtectedRoute allowedRoles={['driver', 'admin']}>
                  <RouteManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport/live"
              element={
                <ProtectedRoute allowedRoles={['driver', 'admin', 'student', 'warden']}>
                  <LiveTracking />
                </ProtectedRoute>
              }
            />

            {/* Student & Fee Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'warden']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/outpass"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'warden']}>
                  <OutpassForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/fees"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'warden']}>
                  <FeeStatus />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

