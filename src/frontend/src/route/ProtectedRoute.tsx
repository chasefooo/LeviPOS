import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  // Always allow access to the signout page
  if (location.pathname === '/signout') {
    return <Outlet />;
  }

  const [checking, setChecking] = useState(true);

  // Wait until useAuth initializes user
  useEffect(() => {
    // user is undefined initially; once defined (even null), auth is checked
    if (user !== undefined) {
      setChecking(false);
    }
  }, [user]);

  if (checking) {
    // Optionally show nothing or a loading indicator
    return null;
  }
  return user ? <Outlet /> : <Navigate to="/signin" replace />;
}
