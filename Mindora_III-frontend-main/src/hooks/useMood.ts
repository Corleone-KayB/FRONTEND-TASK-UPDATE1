import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteMoodEntry,
  fetchMoodHistory,
  fetchMoodReport,
  fetchMoodStreak,
  fetchMoodSummary,
  fetchMoodToday,
  logMood,
  updateMoodEntry,
} from "@/lib/mood-api";
import { ApiError } from "@/lib/api";
import type { LogMoodRequest, UpdateMoodRequest } from "@/types/domain";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// Resolves once per call, not memoized - this is cheap and the IANA zone could
// theoretically change (laptop travel) between mounts, so always ask fresh.
function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Call on check-in page mount. Drives the "N check-ins left today" banner and
// lets the UI disable submission at the cap instead of only discovering it via
// a 429 after the fact.
export function useMoodToday() {
  const timezone = localTimezone();
  return useQuery({
    queryKey: ["mood", "today", timezone],
    queryFn: () => fetchMoodToday(timezone),
  });
}

export function useMoodHistory(params: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["mood", "history", params],
    queryFn: () => fetchMoodHistory(params),
  });
}

// Powers the weekly insights chart on the check-in page - /summary never
// zero-fills, so every bucket it returns is a week the user actually logged.
export function useMoodSummary(params: {
  startDate?: string;
  endDate?: string;
  granularity?: "day" | "week" | "month";
}) {
  return useQuery({
    queryKey: ["mood", "summary", params],
    queryFn: () => fetchMoodSummary(params),
  });
}

export function useMoodStreak() {
  return useQuery({
    queryKey: ["mood", "streak"],
    queryFn: fetchMoodStreak,
  });
}

// Therapist only. 404 means no mood data for this patient in the last 30 days -
// callers should treat that as an empty state, not an error banner.
export function useMoodReport(userId: string | null) {
  return useQuery({
    queryKey: ["mood", "report", userId],
    queryFn: () => fetchMoodReport(userId as string),
    enabled: !!userId,
    retry: false,
  });
}

// Deliberately no toast here - the check-in form already shows inline
// success/daily-limit/error feedback with dedicated treatment for each case.
export function useLogMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LogMoodRequest) => logMood(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood"] });
    },
  });
}

export function useUpdateMoodEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMoodRequest }) =>
      updateMoodEntry(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood"] });
      toast.success("Check-in updated.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update this check-in.")),
  });
}

export function useDeleteMoodEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMoodEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood"] });
      toast.success("Check-in deleted.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not delete this check-in.")),
  });
}
