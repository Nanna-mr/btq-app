import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { UserRole } from '../../types/User';
import { useAuthStore } from '../../stores/authStore';

interface RoleRouteProps {
  role: UserRole;
  children: ReactNode;
}

export function RoleRoute({ role, children }: RoleRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== role) {
    return <Navigate to="/vente" replace />;
  }

  return <>{children}</>;
}
