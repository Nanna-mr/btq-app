import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { UserRole } from '../../types/User';
import { useAuthStore } from '../../stores/authStore';

interface RoleRouteProps {
  role?: UserRole;
  roles?: UserRole[];
  children: ReactNode;
}

function canAccess(userRole: UserRole | undefined, allowedRoles: UserRole[]) {
  if (!userRole) {
    return false;
  }

  if (userRole === 'gerant') {
    return true;
  }

  return allowedRoles.includes(userRole);
}

export function RoleRoute({ role, roles, children }: RoleRouteProps) {
  const user = useAuthStore((state) => state.user);
  const allowedRoles = roles ?? (role ? [role] : []);

  if (!canAccess(user?.role, allowedRoles)) {
    return <Navigate to="/vente" replace />;
  }

  return <>{children}</>;
}
