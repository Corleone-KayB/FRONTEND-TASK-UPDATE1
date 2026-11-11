import { apiFetch } from "@/lib/api";
import { toQueryString } from "@/lib/query-string";
import type {
  LogMoodRequest,
  MoodEntry,
  MoodStreak,
  MoodSummaryResponse,
  MoodTodayResponse,
  UpdateMoodRequest,
} from "@/types/domain";

interface MoodHistoryResponse {
  entries: MoodEntry[];
  total: number;
  page: number;
  limit: number;
}

// Therapist-only patient mood summary - no raw journal notes.
interface MoodReport {
  userId: string;
  avgMoodScore: number;
  entryCount: number;
}

// GET /api/v1/mood/today - call on check-in page mount. Always pass the
// caller's IANA timezone; the server defaults to UTC otherwise.
export function fetchMoodToday(timezone: string): Promise<MoodTodayResponse> {
  return apiFetch(`/api/v1/mood/today${toQueryString({ timezone })}`);
}

// POST /api/v1/mood/log - patient only. Max 10 *writes* per day (429), which
// counts backfilled entries too, regardless of which day they're recorded for.
export function logMood(body: LogMoodRequest): Promise<MoodEntry> {
  return apiFetch("/api/v1/mood/log", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// PUT /api/v1/mood/:id - partial update. recordedAt is deliberately not
// accepted here (mood_entries is a TimescaleDB hypertable partitioned on that
// column - moving a row between chunks is a DB-level rejection, not a policy
// choice). To fix a date: delete the entry, then re-log with the right
// recordedAt. 404 covers both "not found" and "not yours", indistinguishably.
export function updateMoodEntry(id: string, body: UpdateMoodRequest): Promise<MoodEntry> {
  return apiFetch(`/api/v1/mood/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// DELETE /api/v1/mood/:id - 204 no body. apiFetch already special-cases 204
// (returns null instead of trying to parse a body), so this is safe as-is.
export function deleteMoodEntry(id: string): Promise<null> {
  return apiFetch(`/api/v1/mood/${id}`, { method: "DELETE" });
}

// GET /api/v1/mood/history - patient only, paginated. Right endpoint for a
// scrollable list of raw entries; use /summary instead for chart data.
export function fetchMoodHistory(params: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<MoodHistoryResponse> {
  return apiFetch(`/api/v1/mood/history${toQueryString(params)}`);
}

// GET /api/v1/mood/summary - for charts. No zero-filling: sparse ranges give
// sparse buckets, not entryCount: 0 entries. Defaults to last 30 days, daily.
export function fetchMoodSummary(params: {
  startDate?: string;
  endDate?: string;
  granularity?: "day" | "week" | "month";
}): Promise<MoodSummaryResponse> {
  return apiFetch(`/api/v1/mood/summary${toQueryString(params)}`);
}

// GET /api/v1/mood/streak - patient only.
export function fetchMoodStreak(): Promise<MoodStreak> {
  return apiFetch("/api/v1/mood/streak");
}

// GET /api/v1/mood/report/:userId - therapist only. 404 if no data in last 30 days.
export function fetchMoodReport(userId: string): Promise<MoodReport> {
  return apiFetch(`/api/v1/mood/report/${userId}`);
}
