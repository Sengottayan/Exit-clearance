import { useAuthStore } from '@/store/authStore';
import { Role } from '@/lib/types';

export function useAuth() {
  const user = useAuthStore(state => state.user);
  
  const hasRole = (roles: Role | Role[]) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return {
    user,
    isAuthenticated: !!user,
    hasRole,
    isEmployee: user?.role === 'employee',
    isManager: user?.role === 'manager',
    isHR: user?.role === 'hr',
    isDeptApprover: user?.role === 'dept_approver',
    isAdmin: user?.role === 'admin',
  };
}
