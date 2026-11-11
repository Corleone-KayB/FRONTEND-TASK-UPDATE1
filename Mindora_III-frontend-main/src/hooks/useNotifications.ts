import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications-api";
import { fetchUserPreferences, updateNotificationPreferences } from "@/lib/user-api";
import type { NotificationPreferences } from "@/types/domain";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// No websocket for this feed - poll so the bell's unread count stays
// reasonably fresh without the user having to reopen the panel.
export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["notifications", page, limit],
    queryFn: () => fetchNotifications(page, limit),
    refetchInterval: 30_000,
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not mark all as read.")),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not mark this as read.")),
  });
}

// GET /api/v1/users/:userId/preferences - source of truth for the current
// notification preference toggles (MeResponse doesn't carry them).
export function useUserPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-preferences", userId],
    queryFn: () => fetchUserPreferences(userId as string),
    enabled: !!userId,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<NotificationPreferences>) => updateNotificationPreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not save your notification preferences.")),
  });
}
