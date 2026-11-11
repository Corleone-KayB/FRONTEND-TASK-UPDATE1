import { apiFetch } from "@/lib/api";
import type {
  MeResponse,
  NotificationPreferences,
  UpdateProfileRequest,
  UserPreferencesResponse,
} from "@/types/domain";

// GET /api/v1/users/me
export function fetchMyProfile(): Promise<MeResponse> {
  return apiFetch("/api/v1/users/me");
}

// PUT /api/v1/users/me - patient/therapist only. All fields optional; only ones present
// in the body are changed.
export function updateProfile(body: UpdateProfileRequest): Promise<MeResponse> {
  return apiFetch("/api/v1/users/me", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// PUT /api/v1/users/me/fcm-token - patient/therapist only.
export function updateFcmToken(fcmToken: string): Promise<{ message: string }> {
  return apiFetch("/api/v1/users/me/fcm-token", {
    method: "PUT",
    body: JSON.stringify({ fcmToken }),
  });
}

// PUT /api/v1/users/me/notification-preferences - partial update, merged onto the
// currently stored value. Patient/therapist only.
export function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<{ notificationPreferences: NotificationPreferences }> {
  return apiFetch("/api/v1/users/me/notification-preferences", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}

// GET /api/v1/users/:userId/preferences - callable by the user themselves or a
// SERVICE-role caller.
export function fetchUserPreferences(userId: string): Promise<UserPreferencesResponse> {
  return apiFetch(`/api/v1/users/${userId}/preferences`);
}
