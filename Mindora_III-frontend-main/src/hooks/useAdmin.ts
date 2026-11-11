import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addTherapistApplicationNote,
  approveTherapistApplication,
  decryptPostAuthor,
  fetchAlerts,
  fetchAnalytics,
  fetchAuditLog,
  fetchDetailedAnalytics,
  fetchModerationQueue,
  fetchTherapistApplication,
  fetchTherapistApplications,
  fetchUsers,
  reactivateTherapist,
  reactivateUser,
  rejectTherapistApplication,
  requestTherapistApplicationInfo,
  resolveAlert,
  resolveModerationReport,
  suspendTherapist,
  suspendUser,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import type { TherapistApplicationStatus } from "@/types/domain";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useAdminUsers(params: {
  role?: "PATIENT" | "THERAPIST" | "ADMIN";
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => fetchUsers(params),
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => suspendUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User suspended.");
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => reactivateUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User reactivated.");
    },
  });
}

export function useModerationQueue(params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["admin", "moderation", params],
    queryFn: () => fetchModerationQueue(params),
    retry: false,
  });
}

export function useResolveModerationReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      reason,
    }: {
      id: string;
      decision: "REMOVED" | "DISMISSED";
      reason: string;
    }) => resolveModerationReport(id, { decision, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "moderation"] });
      toast.success("Report resolved.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not resolve this report.")),
  });
}

export function useDecryptPostAuthor() {
  return useMutation({
    mutationFn: (postId: string) => decryptPostAuthor(postId),
    onError: (error) => toast.error(errorMessage(error, "Could not decrypt this post's author.")),
  });
}

export function usePlatformAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: fetchAnalytics,
  });
}

export function useDetailedAnalytics(range: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["admin", "analytics", "detailed", range],
    queryFn: () => fetchDetailedAnalytics(range),
  });
}

export function useAuditLog(params: {
  adminId?: string;
  actionType?: string;
  targetId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["admin", "audit-log", params],
    queryFn: () => fetchAuditLog(params),
  });
}

export function useAlerts(params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["admin", "alerts", params],
    queryFn: () => fetchAlerts(params),
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      toast.success("Alert resolved.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not resolve this alert.")),
  });
}

// --- Therapist applications ---

export function useAdminTherapistApplications(params: {
  status?: TherapistApplicationStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "submittedAt" | "createdAt" | "reviewedAt" | "fullName";
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["admin", "therapist-applications", "list", params],
    queryFn: () => fetchTherapistApplications(params),
  });
}

export function useAdminTherapistApplication(id: string | null) {
  return useQuery({
    queryKey: ["admin", "therapist-applications", "detail", id],
    queryFn: () => fetchTherapistApplication(id as string),
    enabled: !!id,
  });
}

export function useApproveTherapistApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveTherapistApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "therapist-applications"] });
      toast.success("Application approved.");
    },
    onError: (error) => {
      // 503 means the application record itself was already marked approved but
      // activating the therapist role failed - that needs a manual retry, not a
      // generic "something went wrong".
      if (error instanceof ApiError && error.status === 503) {
        toast.error(
          error.message || "Application approved, but activating the therapist role failed. Retry."
        );
        return;
      }
      toast.error(errorMessage(error, "Could not approve this application."));
    },
  });
}

export function useRejectTherapistApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectTherapistApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "therapist-applications"] });
      toast.success("Application rejected.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not reject this application.")),
  });
}

export function useRequestTherapistApplicationInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      requestTherapistApplicationInfo(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "therapist-applications"] });
      toast.success("More information requested.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not request more information.")),
  });
}

export function useAddTherapistApplicationNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      addTherapistApplicationNote(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "therapist-applications"] });
      toast.success("Note added.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not add this note.")),
  });
}

export function useSuspendTherapist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => suspendTherapist(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "therapist-applications"] });
      toast.success("Therapist suspended.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not suspend this therapist.")),
  });
}

export function useReactivateTherapist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => reactivateTherapist(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "therapist-applications"] });
      toast.success("Therapist reactivated.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not reactivate this therapist.")),
  });
}
