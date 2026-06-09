import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '@/lib/types';
import { MOCK_USERS } from '@/lib/constants';

interface AuthState {
  user: User | null;
  login: (emailOrId: string, password?: string) => User | null;
  loginById: (userId: string) => void;
  setClerkUser: (clerkUserId: string, role: Role, name?: string, email?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (email, password) => {
        const found = MOCK_USERS.find(u => u.email === email && (password === undefined || u.password === password));
        if (found) { set({ user: found as User }); return found as User; }
        return null;
      },
      loginById: (userId) => {
        const found = MOCK_USERS.find(u => u.id === userId);
        if (found) set({ user: found as User });
      },
      setClerkUser: (clerkUserId, role, name, email) => {
        const clerkUser: User = {
          id: clerkUserId,
          email: email || '',
          name: name || '',
          role,
          dept: '',
          employeeId: clerkUserId.slice(0, 8).toUpperCase(),
        };
        set({ user: clerkUser });
      },
      logout: () => set({ user: null }),
    }),
    { name: 'exitflow-auth' }
  )
);
