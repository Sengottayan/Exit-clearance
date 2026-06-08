import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';
import { MOCK_USERS } from '@/lib/constants';

interface AuthState {
  user: User | null;
  login: (emailOrId: string, password?: string) => User | null;
  loginById: (userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
      logout: () => set({ user: null }),
    }),
    { name: 'exitflow-auth' }
  )
);
