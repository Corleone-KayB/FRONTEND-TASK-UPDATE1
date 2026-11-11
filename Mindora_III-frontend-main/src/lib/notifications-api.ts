import { apiFetch } from "@/lib/api";
import type { NotificationsListResponse } from "@/types/domain";

// GET /api/v1/notifications?page=&limit= - any authenticated role, own notifications only.
export function fetchNotifications(page = 1, limit = 20): Promise<NotificationsListResponse> {
  return apiFetch(`/api/v1/notifications?page=${page}&limit=${limit}`);
}

// PUT /api/v1/notifications/read-all - marks every one of the caller's unread notifications read.
export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiFetch("/api/v1/notifications/read-all", { method: "PUT" });
}

// PUT /api/v1/notifications/:id/read - 404 if it doesn't exist or isn't owned by the caller.
export function markNotificationRead(id: string): Promise<{ id: string; readAt: string }> {
  return apiFetch(`/api/v1/notifications/${id}/read`, { method: "PUT" });
}
