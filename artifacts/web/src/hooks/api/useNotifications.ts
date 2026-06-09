import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";

const notifKeys = {
  all: ["notifications"] as const,
  list: (userId: string) => ["notifications", "list", userId] as const,
};

interface ApiNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  read: boolean;
  created_at: string;
}

export function useNotifications(unreadOnly?: boolean) {
  const user = useAuthStore((s) => s.user);
  const enabled = !!user;

  return useQuery({
    queryKey: [...notifKeys.list(user?.id ?? ""), { unreadOnly }],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user!.id}`);
        if (!res.ok) throw new Error("API unavailable");
        const data = await res.json();
        let notifs = data.notifications as ApiNotification[];
        if (unreadOnly) notifs = notifs.filter((n: ApiNotification) => !n.read);
        return notifs.map(mapToAppNotification);
      } catch {
        const store = useNotificationStore.getState();
        let notifs = store.getForUser(user!.id);
        if (unreadOnly) notifs = notifs.filter((n) => !n.read);
        return notifs;
      }
    },
    enabled,
  });
}

export function useUnreadCount() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["notifications", "unread", user?.id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user!.id}`);
        if (!res.ok) throw new Error("API unavailable");
        const data = await res.json();
        return data.unreadCount as number;
      } catch {
        return useNotificationStore.getState().getUnreadCount(user!.id);
      }
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        await fetch(`/api/notifications/${notificationId}/mark-read`, { method: "POST" });
      } catch {
        useNotificationStore.getState().markRead(notificationId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notifKeys.list(user?.id ?? "") });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async () => {
      try {
        await fetch("/api/notifications/mark-all-read", { method: "POST" });
      } catch {
        useNotificationStore.getState().markAllRead(user!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notifKeys.list(user?.id ?? "") });
    },
  });
}

export function useNotificationPreferences() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["notifications", "preferences", user?.id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/notifications/preferences?userId=${user!.id}`);
        if (!res.ok) throw new Error("API unavailable");
        return await res.json();
      } catch {
        return useNotificationStore.getState().getPreferences(user!.id);
      }
    },
    enabled: !!user,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      try {
        await fetch(`/api/notifications/preferences`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user!.id, ...updates }),
        });
      } catch {
        useNotificationStore.getState().updatePreferences(user!.id, updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences", user?.id] });
    },
  });
}

function mapToAppNotification(n: ApiNotification) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    href: n.href,
    read: n.read,
    createdAt: n.created_at,
  };
}
