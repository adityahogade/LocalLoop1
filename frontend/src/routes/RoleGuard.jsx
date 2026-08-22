import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleGuard({ allowedRoles = [], fallbackPath = '/login', children }) {
  const { isReady, isAuthenticated, role } = useAuth();

  if (!isReady) {
    return <div className="route-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
