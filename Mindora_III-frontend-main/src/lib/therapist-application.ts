import type { TherapistApplicationStatus } from "@/types/domain";

// Shared between the applicant-facing status page and the admin list/detail
// pages so the two surfaces describe the same 6 statuses identically.
export const THERAPIST_APPLICATION_STATUS_LABEL: Record<TherapistApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  MORE_INFORMATION_REQUIRED: "More info needed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const THERAPIST_APPLICATION_STATUS_BADGE_VARIANT: Record<
  TherapistApplicationStatus,
  "default" | "success" | "pending" | "secondary" | "destructive"
> = {
  DRAFT: "secondary",
  SUBMITTED: "pending",
  UNDER_REVIEW: "default",
  MORE_INFORMATION_REQUIRED: "destructive",
  APPROVED: "success",
  REJECTED: "destructive",
};
