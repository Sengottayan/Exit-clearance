import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '@/lib/types';

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  setClerkUser: (clerkUserId: string, role: Role, name?: string, email?: string) => void;
  updateUserManager: (managerId: string, managerName: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (user) => {
        if (typeof document !== 'undefined') {
          document.cookie = `demo-user-id=${user.id}; path=/; max-age=86400`;
        }
        set({ user });
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

        // Asynchronously sync user to DB and fetch real manager assignment.
        // This is fire-and-forget — it updates the store when it resolves.
        if (typeof window !== 'undefined') {
          fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: clerkUser.email,
              name: clerkUser.name,
              role: clerkUser.role,
              dept: clerkUser.dept,
              employeeId: clerkUser.employeeId,
            }),
          })
            .then((res) => res.ok ? res.json() : null)
            .then((profile) => {
              if (profile) {
                get().updateUserProfile({
                  avatarUrl: profile.avatarUrl,
                  managerId: profile.managerId,
                  managerName: profile.managerName,
                });
              }
            })
            .catch(() => {
              // Silently ignore — app works fine without DB-backed manager info
            });
        }
      },
      updateUserManager: (managerId, managerName) => {
        set((state) => ({
          user: state.user ? { ...state.user, managerId, managerName } : null,
        }));
      },
      updateUserProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
      logout: () => set({ user: null }),
    }),
    { name: 'exitflow-auth' }
  )
);
