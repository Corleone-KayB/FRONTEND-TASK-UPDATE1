import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  createOrResumeTherapistApplication,
  fetchMyTherapistApplications,
  submitTherapistApplication,
  updateTherapistApplication,
  uploadTherapistDocument,
} from "@/lib/therapist-application-api";
import type { TherapistDocumentType, UpdateTherapistApplicationRequest } from "@/types/domain";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useMyTherapistApplications() {
  return useQuery({
    queryKey: ["therapist-application", "mine"],
    queryFn: fetchMyTherapistApplications,
  });
}

export function useCreateTherapistApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrResumeTherapistApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist-application"] });
    },
    onError: (error) => {
      // 409 (an application is already SUBMITTED/UNDER_REVIEW) is an expected,
      // routine outcome here, not a failure - the caller reads
      // error.body.application off it and routes accordingly, so this
      // shouldn't also surface as a scary toast.
      if (error instanceof ApiError && error.status === 409) return;
      toast.error(errorMessage(error, "Could not start your application."));
    },
  });
}

export function useUpdateTherapistApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTherapistApplicationRequest }) =>
      updateTherapistApplication(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist-application"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not save your changes.")),
  });
}

export function useSubmitTherapistApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => submitTherapistApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist-application"] });
      toast.success("Application submitted.");
    },
    onError: (error) => {
      // Field-level "incomplete application" errors are surfaced inline on the
      // review step instead of a toast - only toast for anything else.
      if (error instanceof ApiError && error.fieldErrors) return;
      toast.error(errorMessage(error, "Could not submit your application."));
    },
  });
}

export function useUploadTherapistDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      documentType,
    }: {
      id: string;
      file: File;
      documentType: TherapistDocumentType;
    }) => uploadTherapistDocument(id, file, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist-application"] });
      toast.success("Document uploaded.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not upload this document.")),
  });
}
