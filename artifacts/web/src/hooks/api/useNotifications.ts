import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";

const notifKeys = {
  all: ["notifications"] as const,
  list: (userId: string) => ["notifications", "list", userId] as const,
};

export function useNotifications(unreadOnly?: boolean) {
  const user = useAuthStore((s) => s.user);
  const enabled = !!user;

  return useQuery({
    queryKey: [...notifKeys.list(user?.id ?? ""), { unreadOnly }],
    queryFn: () => {
      const store = useNotificationStore.getState();
      let notifs = store.getForUser(user!.id);
      if (unreadOnly) notifs = notifs.filter((n) => !n.read);
      return notifs;
    },
    enabled,
  });
}

export function useUnreadCount() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["notifications", "unread", user?.id],
    queryFn: () => useNotificationStore.getState().getUnreadCount(user!.id),
    enabled: !!user,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (notificationId: string) => {
      useNotificationStore.getState().markRead(notificationId);
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
      useNotificationStore.getState().markAllRead(user!.id);
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
    queryFn: () => useNotificationStore.getState().getPreferences(user!.id),
    enabled: !!user,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      useNotificationStore.getState().updatePreferences(user!.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences", user?.id] });
    },
  });
}
