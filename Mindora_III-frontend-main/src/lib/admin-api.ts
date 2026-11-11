import { apiFetch } from "@/lib/api";
import { toQueryString } from "@/lib/query-string";
import type {
  AdminUserRecord,
  AuditLogEntry,
  DetailedAnalytics,
  PlatformAnalytics,
  SystemAlert,
  TherapistApplication,
  TherapistApplicationNote,
  TherapistApplicationStatus,
} from "@/types/domain";

interface UserListResponse {
  users: AdminUserRecord[];
  total: number;
  page: number;
  limit: number;
}

interface SuspendReactivateResponse {
  message: string;
  userId: string;
  auditLogId: string;
}

// Community Service isn't deployed in V1, so this proxies to something that's always down -
// callers should expect a 503 in the current environment.
interface ModerationReport {
  id: string;
  postId: string;
  reason: string;
  createdAt: string;
}

interface ModerationQueueResponse {
  reports: ModerationReport[];
  total: number;
  page: number;
  limit: number;
}

interface AlertListResponse {
  alerts: SystemAlert[];
  total: number;
  page: number;
  limit: number;
}

interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/v1/admin/users - proxies through User Service to Auth Service.
export function fetchUsers(params: {
  role?: "PATIENT" | "THERAPIST" | "ADMIN";
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<UserListResponse> {
  return apiFetch(`/api/v1/admin/users${toQueryString(params)}`);
}

// PUT /api/v1/admin/users/:id/suspend - blocks the account immediately, revokes refresh tokens.
export function suspendUser(id: string, reason: string): Promise<SuspendReactivateResponse> {
  return apiFetch(`/api/v1/admin/users/${id}/suspend`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

// PUT /api/v1/admin/users/:id/reactivate
export function reactivateUser(id: string, reason: string): Promise<SuspendReactivateResponse> {
  return apiFetch(`/api/v1/admin/users/${id}/reactivate`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

// GET /api/v1/admin/moderation/queue - proxies live to Community Service (not deployed in V1).
export function fetchModerationQueue(params: {
  page?: number;
  limit?: number;
}): Promise<ModerationQueueResponse> {
  return apiFetch(`/api/v1/admin/moderation/queue${toQueryString(params)}`);
}

// PUT /api/v1/admin/moderation/:id/resolve
export function resolveModerationReport(
  id: string,
  body: { decision: "REMOVED" | "DISMISSED"; reason: string }
): Promise<void> {
  return apiFetch(`/api/v1/admin/moderation/${id}/resolve`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// POST /api/v1/admin/moderation/decrypt/:postId - always audit-logged.
export function decryptPostAuthor(postId: string): Promise<{ userId: string }> {
  return apiFetch(`/api/v1/admin/moderation/decrypt/${postId}`, { method: "POST" });
}

// GET /api/v1/admin/analytics - aggregated in parallel from every service; any field may be
// null if that specific service was unreachable. Always 200.
export function fetchAnalytics(): Promise<PlatformAnalytics> {
  return apiFetch("/api/v1/admin/analytics");
}

// GET /api/v1/admin/analytics/detailed - aggregated in parallel from every service,
// same null-safety convention as /analytics above (a whole section is null, not its
// fields individually). `from`/`to` are both optional ISO datetime strings; the
// server defaults to the last 30 days when either is omitted. Always 200.
export function fetchDetailedAnalytics(params: {
  from?: string;
  to?: string;
}): Promise<DetailedAnalytics> {
  return apiFetch(`/api/v1/admin/analytics/detailed${toQueryString(params)}`);
}

// GET /api/v1/admin/audit-log - read-only, immutable.
export function fetchAuditLog(params: {
  adminId?: string;
  actionType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<AuditLogResponse> {
  return apiFetch(`/api/v1/admin/audit-log${toQueryString(params)}`);
}

// GET /api/v1/admin/alerts - unresolved AI_CRISIS / MOOD_CONCERN alerts, newest first.
export function fetchAlerts(params: { page?: number; limit?: number }): Promise<AlertListResponse> {
  return apiFetch(`/api/v1/admin/alerts${toQueryString(params)}`);
}

// PUT /api/v1/admin/alerts/:id/resolve - always a manual admin action.
export function resolveAlert(id: string): Promise<void> {
  return apiFetch(`/api/v1/admin/alerts/${id}/resolve`, { method: "PUT" });
}

// --- Therapist applications ---

interface TherapistApplicationListResponse {
  applications: TherapistApplication[];
  total: number;
  page: number;
  limit: number;
}

interface TherapistApplicationDetailResponse {
  application: TherapistApplication;
}

interface TherapistApplicationActionResponse {
  message: string;
  application: TherapistApplication;
  auditLogId: string;
}

interface AddTherapistApplicationNoteResponse {
  note: TherapistApplicationNote;
  auditLogId: string;
}

interface TherapistActionResponse {
  message: string;
  userId: string;
  auditLogId: string;
}

// GET /api/v1/admin/therapist-applications
export function fetchTherapistApplications(params: {
  status?: TherapistApplicationStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "submittedAt" | "createdAt" | "reviewedAt" | "fullName";
  sortOrder?: "asc" | "desc";
}): Promise<TherapistApplicationListResponse> {
  return apiFetch(`/api/v1/admin/therapist-applications${toQueryString(params)}`);
}

// GET /api/v1/admin/therapist-applications/:id - includes `documents` (each with a
// short-lived signed download `url`) and `notes`.
export function fetchTherapistApplication(id: string): Promise<TherapistApplicationDetailResponse> {
  return apiFetch(`/api/v1/admin/therapist-applications/${id}`);
}

// PUT /api/v1/admin/therapist-applications/:id/approve - no body. Can 409 if the
// application isn't currently SUBMITTED/UNDER_REVIEW, or 503 (body carries `userId`)
// in the rare case the application was marked approved but role activation failed -
// callers must treat that as an error requiring manual retry, never as a success.
export function approveTherapistApplication(
  id: string
): Promise<TherapistApplicationActionResponse> {
  return apiFetch(`/api/v1/admin/therapist-applications/${id}/approve`, { method: "PUT" });
}

// PUT /api/v1/admin/therapist-applications/:id/reject
export function rejectTherapistApplication(
  id: string,
  reason: string
): Promise<TherapistApplicationActionResponse> {
  return apiFetch(`/api/v1/admin/therapist-applications/${id}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

// PUT /api/v1/admin/therapist-applications/:id/request-info
export function requestTherapistApplicationInfo(
  id: string,
  note: string
): Promise<TherapistApplicationActionResponse> {
  return apiFetch(`/api/v1/admin/therapist-applications/${id}/request-info`, {
    method: "PUT",
    body: JSON.stringify({ note }),
  });
}

// POST /api/v1/admin/therapist-applications/:id/notes - internal reviewer
// commentary, never shown to the applicant.
export function addTherapistApplicationNote(
  id: string,
  note: string
): Promise<AddTherapistApplicationNoteResponse> {
  return apiFetch(`/api/v1/admin/therapist-applications/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

// PUT /api/v1/admin/therapists/:id/suspend - :id is the therapist's userId, not the
// application id. A distinct route from /api/v1/admin/users/:id/suspend above -
// additive, doesn't touch suspendUser/reactivateUser or their callers.
export function suspendTherapist(id: string, reason: string): Promise<TherapistActionResponse> {
  return apiFetch(`/api/v1/admin/therapists/${id}/suspend`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

// PUT /api/v1/admin/therapists/:id/reactivate
export function reactivateTherapist(id: string, reason: string): Promise<TherapistActionResponse> {
  return apiFetch(`/api/v1/admin/therapists/${id}/reactivate`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}
