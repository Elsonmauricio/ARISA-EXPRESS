import { Navigate } from 'react-router-dom';
import { logout } from '../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    logout();
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    if (requireAdmin && user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch {
    logout();
    return <Navigate to="/login" replace />;
  }
}
