import { Navigate, Outlet, useLocation } from 'react-router-dom';
import appConfig from '@/configs/app.config';
import { useAuth } from '@/contexts/AuthContext';

const { authenticatedEntryPath } = appConfig;

const PublicRoute = () => {
  const { user } = useAuth();
  const location = useLocation();

  // If user is signed in but visiting signout page, allow access
  if (user && location.pathname === '/signout') {
    return <Outlet />;
  }
  // Otherwise, for signed-in users redirect away from public pages
  return user ? <Navigate to={authenticatedEntryPath} /> : <Outlet />;
};

export default PublicRoute;
