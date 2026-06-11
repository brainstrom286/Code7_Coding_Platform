import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';

export default function ProtectedRoute({ role, children }) {
  const location = useLocation();
  if (!isAuthenticated(role)) {
    const loginPath = role === 'admin' ? '/admin/login' : '/student/login';
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }
  return children;
}
