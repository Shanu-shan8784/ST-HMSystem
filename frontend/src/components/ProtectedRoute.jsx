import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Authenticating session...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not in allowed roles -> Silently redirect to their own portal
  // Non-admins (warden, driver, student/parent) will NEVER see any admin screen
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const roleFallback =
      role === 'warden'
        ? '/warden/dashboard'
        : role === 'driver'
        ? '/transport/dashboard'
        : role === 'student'
        ? '/student/dashboard'
        : '/login';

    return <Navigate to={roleFallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
