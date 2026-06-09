import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '@/lib/types';
import { MOCK_USERS } from '@/lib/constants';

interface AuthState {
  user: User | null;
  login: (emailOrId: string, password?: string) => User | null;
  loginById: (userId: string) => void;
  setClerkUser: (clerkUserId: string, role: Role, name?: string, email?: string) => void;
  updateUserManager: (managerId: string, managerName: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (email, password) => {
        const normalizedInput = email.trim().toLowerCase();
        const found = MOCK_USERS.find(
          (u) =>
            (u.email.toLowerCase() === normalizedInput || u.employeeId.toLowerCase() === normalizedInput) &&
            (password === undefined || u.password === password),
        );
        if (found) { set({ user: found as User }); return found as User; }
        return null;
      },
      loginById: (userId) => {
        const found = MOCK_USERS.find(u => u.id === userId);
        if (found) set({ user: found as User });
      },
      setClerkUser: (clerkUserId, role, name, email) => {
        const normalizedEmail = email?.trim().toLowerCase() ?? '';
        // Try to match against mock users by email for local dev fallback
        const matchedUser = normalizedEmail
          ? MOCK_USERS.find((candidate) => candidate.email.toLowerCase() === normalizedEmail)
          : undefined;

        const clerkUser: User = {
          id: clerkUserId,
          email: email || matchedUser?.email || '',
          name: name || matchedUser?.name || '',
          role,
          dept: matchedUser?.dept || '',
          employeeId: matchedUser?.employeeId || clerkUserId.slice(0, 8).toUpperCase(),
          managerId: matchedUser?.managerId,
          managerName: matchedUser?.managerName,
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
              if (profile?.managerId) {
                get().updateUserManager(profile.managerId, profile.managerName ?? '');
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
