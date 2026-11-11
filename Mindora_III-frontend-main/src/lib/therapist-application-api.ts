import { apiFetch, apiUpload } from "@/lib/api";
import type {
  TherapistApplication,
  TherapistDocument,
  TherapistDocumentType,
  UpdateTherapistApplicationRequest,
} from "@/types/domain";

interface TherapistApplicationResponse {
  application: TherapistApplication;
}

interface MyTherapistApplicationsResponse {
  applications: TherapistApplication[];
}

interface TherapistDocumentResponse {
  document: TherapistDocument;
}

interface TherapistDocumentUrlResponse {
  url: string;
  fileName: string;
  mimeType: string;
  expiresIn: number;
}

// POST /api/v1/users/therapist-applications - no body. Creates a new application, or
// resumes an existing editable (DRAFT / MORE_INFORMATION_REQUIRED) one - 201 on
// create, 200 on resume. 409 (with the pending application already on
// ApiError.body.application) if one is already SUBMITTED/UNDER_REVIEW.
export function createOrResumeTherapistApplication(): Promise<TherapistApplicationResponse> {
  return apiFetch("/api/v1/users/therapist-applications", { method: "POST" });
}

// GET /api/v1/users/therapist-applications/me - newest first, each with `documents`
// but never `notes` (notes are admin-only).
export function fetchMyTherapistApplications(): Promise<MyTherapistApplicationsResponse> {
  return apiFetch("/api/v1/users/therapist-applications/me");
}

// PUT /api/v1/users/therapist-applications/:id - partial update/autosave, any subset
// of the editable fields. Only allowed while status is DRAFT or
// MORE_INFORMATION_REQUIRED, else 409.
export function updateTherapistApplication(
  id: string,
  body: UpdateTherapistApplicationRequest
): Promise<TherapistApplicationResponse> {
  return apiFetch(`/api/v1/users/therapist-applications/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// POST /api/v1/users/therapist-applications/:id/submit - no body; validates the full
// stored record server-side. 400 with { message, errors } (zod flatten shape) if the
// record is incomplete - surfaced via ApiError.fieldErrors.
export function submitTherapistApplication(id: string): Promise<TherapistApplicationResponse> {
  return apiFetch(`/api/v1/users/therapist-applications/${id}/submit`, { method: "POST" });
}

// POST /api/v1/users/therapist-applications/:id/documents - multipart: `file`
// (pdf/jpg/jpeg/png, max 10MB) + `documentType`.
export function uploadTherapistDocument(
  id: string,
  file: File,
  documentType: TherapistDocumentType
): Promise<TherapistDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);
  return apiUpload(`/api/v1/users/therapist-applications/${id}/documents`, formData);
}

// GET /api/v1/users/therapist-applications/:id/documents/:docId - `url` is a
// short-lived signed download link (backend streams the file from MongoDB
// GridFS, not a real presigned URL - see user-service's object-storage.ts)
// valid for 5 minutes. Fetch fresh on every "view" click, never cache/reuse it.
export function fetchTherapistDocumentUrl(
  id: string,
  docId: string
): Promise<TherapistDocumentUrlResponse> {
  return apiFetch(`/api/v1/users/therapist-applications/${id}/documents/${docId}`);
}
