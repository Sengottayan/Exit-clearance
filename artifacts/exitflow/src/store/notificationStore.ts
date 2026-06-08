import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'approval' | 'sla' | 'system' | 'rejection' | 'completion';

export interface NotificationPreferences {
  approval: boolean;
  sla: boolean;
  system: boolean;
  rejection: boolean;
  completion: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  approval: true,
  sla: true,
  system: true,
  rejection: true,
  completion: true,
};

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  preferences: Record<string, NotificationPreferences>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: (userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getForUser: (userId: string) => AppNotification[];
  updatePreferences: (userId: string, updates: Partial<NotificationPreferences>) => void;
  getPreferences: (userId: string) => NotificationPreferences;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: {},

      addNotification: (notification) => {
        const prefs = get().preferences[notification.userId] ?? DEFAULT_NOTIFICATION_PREFERENCES;
        if (!prefs[notification.type]) return;

        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...state.notifications,
          ].slice(0, 100),
        }));
      },

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: (userId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n,
          ),
        })),

      getUnreadCount: (userId) =>
        get().notifications.filter((n) => n.userId === userId && !n.read).length,

      getForUser: (userId) => get().notifications.filter((n) => n.userId === userId),

      updatePreferences: (userId, updates) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            [userId]: {
              ...(state.preferences[userId] ?? DEFAULT_NOTIFICATION_PREFERENCES),
              ...updates,
            },
          },
        })),

      getPreferences: (userId) => get().preferences[userId] ?? DEFAULT_NOTIFICATION_PREFERENCES,
    }),
    { name: 'exitflow-notifications' },
  ),
);
