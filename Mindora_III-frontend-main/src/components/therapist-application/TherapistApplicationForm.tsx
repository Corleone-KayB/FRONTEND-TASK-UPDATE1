"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api";
import { fetchTherapistDocumentUrl } from "@/lib/therapist-application-api";
import {
  useSubmitTherapistApplication,
  useUpdateTherapistApplication,
  useUploadTherapistDocument,
} from "@/hooks/useTherapistApplication";
import type {
  TherapistApplication,
  TherapistDocumentType,
  UpdateTherapistApplicationRequest,
} from "@/types/domain";

export const SPECIALISATION_SUGGESTIONS = [
  "Anxiety",
  "Depression",
  "Stress Management",
  "Grief",
  "Relationship Counselling",
  "Family Counselling",
  "Trauma Support",
  "Youth Counselling",
  "Addiction Support",
  "General Counselling",
];

export const LANGUAGE_SUGGESTIONS = ["Kinyarwanda", "English", "French"];

export const LOCATION_SUGGESTIONS = [
  "Kigali",
  "Gasabo",
  "Kicukiro",
  "Nyarugenge",
  "Eastern Province",
  "Northern Province",
  "Southern Province",
  "Western Province",
];

const DOCUMENT_TYPE_OPTIONS: { value: TherapistDocumentType; label: string }[] = [
  { value: "LICENSE", label: "License" },
  { value: "CERTIFICATION", label: "Certification" },
  { value: "ID", label: "Government ID" },
  { value: "OTHER", label: "Other" },
];

// Mirrors the backend's editable-fields contract exactly (field constraints per
// the therapist-applications API spec). Doubles as: (a) the per-step
// react-hook-form resolver, validated a step at a time via `trigger()`, and
// (b) the "is this record complete enough to submit" check the review step
// runs client-side before hitting the submit endpoint.
export const therapistApplicationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Enter your full name (at least 2 characters)")
    .max(100, "Full name must be 100 characters or fewer"),
  phoneNumber: z
    .string()
    .min(7, "Enter a valid phone number")
    .max(20, "Phone number must be 20 characters or fewer"),
  contactEmail: z.string().email("Enter a valid email address"),
  professionalBio: z
    .string()
    .min(1, "Tell us about your professional background")
    .max(4000, "Bio must be 4000 characters or fewer"),
  qualifications: z
    .array(z.string().min(1).max(200))
    .min(1, "Add at least one qualification")
    .max(20, "Add at most 20 qualifications"),
  certifications: z.array(z.string().min(1).max(200)).max(20, "Add at most 20 certifications"),
  licenseNumber: z
    .string()
    .min(1, "Enter your license number")
    .max(100, "License number must be 100 characters or fewer"),
  licenseIssuingBody: z
    .string()
    .min(1, "Enter the body that issued your license")
    .max(200, "Must be 200 characters or fewer"),
  licenseExpiryDate: z.string().nullable().optional(),
  professionalRegistrationNumber: z
    .string()
    .max(100, "Must be 100 characters or fewer")
    .nullable()
    .optional(),
  specialisations: z
    .array(z.string().min(1).max(100))
    .min(1, "Add at least one specialisation")
    .max(10, "Add at most 10 specialisations"),
  yearsOfExperience: z
    .number({ error: "Enter your years of experience" })
    .int("Must be a whole number")
    .min(0, "Must be 0 or greater")
    .max(70, "Must be 70 or fewer"),
  languages: z
    .array(z.string().min(1).max(50))
    .min(1, "Add at least one language")
    .max(10, "Add at most 10 languages"),
  availabilitySummary: z
    .string()
    .max(1000, "Must be 1000 characters or fewer")
    .nullable()
    .optional(),
  location: z.string().min(1, "Enter your location").max(200, "Must be 200 characters or fewer"),
  timezone: z.string().min(1),
});

export type TherapistApplicationFormValues = z.infer<typeof therapistApplicationSchema>;

const STEP_LABELS = [
  "Basic Info",
  "Professional Background",
  "Specialisations & Location",
  "Documents",
  "Review & Submit",
] as const;

const STEP_FIELDS: (keyof TherapistApplicationFormValues)[][] = [
  ["fullName", "phoneNumber", "contactEmail"],
  [
    "professionalBio",
    "qualifications",
    "certifications",
    "licenseNumber",
    "licenseIssuingBody",
    "licenseExpiryDate",
    "professionalRegistrationNumber",
    "yearsOfExperience",
  ],
  ["specialisations", "languages", "location", "availabilitySummary", "timezone"],
  [],
  [],
];

function defaultsFrom(application: TherapistApplication): TherapistApplicationFormValues {
  return {
    fullName: application.fullName ?? "",
    phoneNumber: application.phoneNumber ?? "",
    contactEmail: application.contactEmail ?? "",
    professionalBio: application.professionalBio ?? "",
    qualifications: application.qualifications ?? [],
    certifications: application.certifications ?? [],
    licenseNumber: application.licenseNumber ?? "",
    licenseIssuingBody: application.licenseIssuingBody ?? "",
    licenseExpiryDate: application.licenseExpiryDate ?? null,
    professionalRegistrationNumber: application.professionalRegistrationNumber ?? null,
    specialisations: application.specialisations ?? [],
    yearsOfExperience: application.yearsOfExperience ?? 0,
    languages: application.languages ?? [],
    availabilitySummary: application.availabilitySummary ?? null,
    location: application.location ?? "",
    timezone: application.timezone || "Africa/Kigali",
  };
}

// Sends only fields that currently carry a meaningful value, rather than the
// whole form every time - a still-empty required-for-submit field (e.g.
// qualifications before the user reaches that step) is simply left out of the
// PUT body instead of being sent as `[]`/`""`, since the backend's per-field
// constraints (e.g. "1-20 items") apply whenever a field is present at all.
function buildUpdatePayload(
  values: TherapistApplicationFormValues
): UpdateTherapistApplicationRequest {
  const payload: UpdateTherapistApplicationRequest = {};
  if (values.fullName) payload.fullName = values.fullName;
  if (values.phoneNumber) payload.phoneNumber = values.phoneNumber;
  if (values.contactEmail) payload.contactEmail = values.contactEmail;
  if (values.professionalBio) payload.professionalBio = values.professionalBio;
  if (values.qualifications.length > 0) payload.qualifications = values.qualifications;
  payload.certifications = values.certifications;
  if (values.licenseNumber) payload.licenseNumber = values.licenseNumber;
  if (values.licenseIssuingBody) payload.licenseIssuingBody = values.licenseIssuingBody;
  payload.licenseExpiryDate = values.licenseExpiryDate || null;
  payload.professionalRegistrationNumber = values.professionalRegistrationNumber || null;
  if (values.specialisations.length > 0) payload.specialisations = values.specialisations;
  if (Number.isFinite(values.yearsOfExperience)) {
    payload.yearsOfExperience = values.yearsOfExperience;
  }
  if (values.languages.length > 0) payload.languages = values.languages;
  payload.availabilitySummary = values.availabilitySummary || null;
  if (values.location) payload.location = values.location;
  if (values.timezone) payload.timezone = values.timezone;
  return payload;
}

interface TagListFieldProps {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxLength: number;
  error?: string;
}

function TagListField({
  label,
  values,
  onChange,
  suggestions,
  placeholder,
  maxLength,
  error,
}: TagListFieldProps) {
  const [draft, setDraft] = useState("");

  function addValue(raw: string) {
    const value = raw.trim();
    if (!value || values.includes(value)) return;
    onChange([...values, value].slice(0, 20));
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1.5 rounded-full bg-mindora-purple-pale px-3 py-1.5 text-[12.5px] font-medium text-mindora-purple"
          >
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== value))}
              aria-label={`Remove ${value}`}
              className="rounded-full hover:bg-mindora-purple/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue(draft);
            }
          }}
        />
        <Button type="button" variant="outline" onClick={() => addValue(draft)}>
          Add
        </Button>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !values.includes(s))
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addValue(s)}
                className="rounded-full border border-border px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground hover:border-mindora-purple hover:text-mindora-purple"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TherapistApplicationFormProps {
  application: TherapistApplication;
}

export function TherapistApplicationForm({ application }: TherapistApplicationFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [documentType, setDocumentType] = useState<TherapistDocumentType>("LICENSE");
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);

  const updateMutation = useUpdateTherapistApplication();
  const uploadMutation = useUploadTherapistDocument();
  const submitMutation = useSubmitTherapistApplication();

  const {
    register,
    watch,
    setValue,
    trigger,
    getValues,
    setError,
    formState: { errors },
  } = useForm<TherapistApplicationFormValues>({
    resolver: zodResolver(therapistApplicationSchema),
    defaultValues: defaultsFrom(application),
  });

  const values = watch();
  const documents = application.documents ?? [];
  const editable =
    application.status === "DRAFT" || application.status === "MORE_INFORMATION_REQUIRED";

  async function saveCurrentValues() {
    if (!editable) return true;
    try {
      await updateMutation.mutateAsync({
        id: application.id,
        body: buildUpdatePayload(getValues()),
      });
      return true;
    } catch {
      return false;
    }
  }

  async function goNext() {
    const fields = STEP_FIELDS[step];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    await saveCurrentValues();
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleFileSelected(file: File) {
    await uploadMutation.mutateAsync({ id: application.id, file, documentType });
  }

  async function handleView(docId: string) {
    setViewError(null);
    setViewingDocId(docId);
    try {
      const { url } = await fetchTherapistDocumentUrl(application.id, docId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setViewError(err instanceof ApiError ? err.message : "Could not open this document.");
    } finally {
      setViewingDocId(null);
    }
  }

  async function handleSubmit() {
    const saved = await saveCurrentValues();
    if (!saved) return;

    const valid = await trigger();
    if (!valid) {
      const firstInvalidStep = STEP_FIELDS.findIndex((fields) => fields.some((f) => errors[f]));
      if (firstInvalidStep >= 0) setStep(firstInvalidStep);
      return;
    }

    try {
      const { application: updated } = await submitMutation.mutateAsync(application.id);
      if (updated.status === "SUBMITTED") {
        router.push("/therapist-application");
      }
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        let firstField: keyof TherapistApplicationFormValues | null = null;
        for (const [field, messages] of Object.entries(err.fieldErrors)) {
          if (field in therapistApplicationSchema.shape && messages[0]) {
            setError(field as keyof TherapistApplicationFormValues, { message: messages[0] });
            firstField ??= field as keyof TherapistApplicationFormValues;
          }
        }
        if (firstField) {
          const stepIndex = STEP_FIELDS.findIndex((fields) => fields.includes(firstField!));
          if (stepIndex >= 0) setStep(stepIndex);
        }
      }
    }
  }

  const progressPct = ((step + 1) / STEP_LABELS.length) * 100;

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-[12.5px] font-semibold text-muted-foreground">
          <span>
            Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
          </span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <Progress value={progressPct} />
      </div>

      {!editable && (
        <div className="mb-5 rounded-2xl bg-mindora-pending-bg px-4 py-3 text-[13px] font-semibold text-mindora-purple">
          This application is {application.status === "SUBMITTED" ? "submitted" : "under review"}{" "}
          and can no longer be edited.
        </div>
      )}

      <div className="rounded-[26px] bg-white p-6 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff] lg:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" disabled={!editable} {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input id="phoneNumber" disabled={!editable} {...register("phoneNumber")} />
              {errors.phoneNumber && (
                <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                disabled={!editable}
                {...register("contactEmail")}
              />
              {errors.contactEmail && (
                <p className="text-xs text-red-500">{errors.contactEmail.message}</p>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="professionalBio">Professional bio</Label>
              <Textarea
                id="professionalBio"
                disabled={!editable}
                className="min-h-[140px]"
                maxLength={4000}
                {...register("professionalBio")}
              />
              {errors.professionalBio && (
                <p className="text-xs text-red-500">{errors.professionalBio.message}</p>
              )}
            </div>

            <TagListField
              label="Qualifications"
              values={values.qualifications}
              onChange={(next) => setValue("qualifications", next, { shouldValidate: true })}
              placeholder="e.g. MSc Clinical Psychology"
              maxLength={200}
              error={errors.qualifications?.message as string | undefined}
            />

            <TagListField
              label="Certifications (optional)"
              values={values.certifications}
              onChange={(next) => setValue("certifications", next, { shouldValidate: true })}
              placeholder="e.g. Certified Trauma Practitioner"
              maxLength={200}
              error={errors.certifications?.message as string | undefined}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="licenseNumber">License number</Label>
                <Input id="licenseNumber" disabled={!editable} {...register("licenseNumber")} />
                {errors.licenseNumber && (
                  <p className="text-xs text-red-500">{errors.licenseNumber.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="licenseIssuingBody">License issuing body</Label>
                <Input
                  id="licenseIssuingBody"
                  disabled={!editable}
                  {...register("licenseIssuingBody")}
                />
                {errors.licenseIssuingBody && (
                  <p className="text-xs text-red-500">{errors.licenseIssuingBody.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="licenseExpiryDate">License expiry date (optional)</Label>
                <Input
                  id="licenseExpiryDate"
                  type="date"
                  disabled={!editable}
                  {...register("licenseExpiryDate")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="professionalRegistrationNumber">
                  Professional registration number (optional)
                </Label>
                <Input
                  id="professionalRegistrationNumber"
                  disabled={!editable}
                  {...register("professionalRegistrationNumber")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="yearsOfExperience">Years of experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min={0}
                  max={70}
                  disabled={!editable}
                  {...register("yearsOfExperience", { valueAsNumber: true })}
                />
                {errors.yearsOfExperience && (
                  <p className="text-xs text-red-500">{errors.yearsOfExperience.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <TagListField
              label="Specialisations"
              values={values.specialisations}
              onChange={(next) => setValue("specialisations", next, { shouldValidate: true })}
              suggestions={SPECIALISATION_SUGGESTIONS}
              placeholder="Add a specialisation"
              maxLength={100}
              error={errors.specialisations?.message as string | undefined}
            />
            <TagListField
              label="Languages"
              values={values.languages}
              onChange={(next) => setValue("languages", next, { shouldValidate: true })}
              suggestions={LANGUAGE_SUGGESTIONS}
              placeholder="Add a language"
              maxLength={50}
              error={errors.languages?.message as string | undefined}
            />
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                disabled={!editable}
                list="location-suggestions"
                {...register("location")}
              />
              <datalist id="location-suggestions">
                {LOCATION_SUGGESTIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
              {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="availabilitySummary">Availability summary (optional)</Label>
              <Textarea
                id="availabilitySummary"
                disabled={!editable}
                maxLength={1000}
                placeholder="e.g. Weekday evenings, Kigali time"
                {...register("availabilitySummary")}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <p className="text-[13.5px] text-muted-foreground">
              Upload your license, certifications, and a government ID. Accepted formats: PDF, JPG,
              PNG (max 10MB each).
            </p>

            {documents.length > 0 && (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-[inset_3px_3px_7px_#e3ddf0,inset_-3px_-3px_7px_#fdfbff]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4.5 w-4.5 shrink-0 text-mindora-purple" />
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-semibold text-foreground">
                          {doc.fileName}
                        </p>
                        <p className="text-[11.5px] text-muted-foreground">
                          {doc.documentType} · {(doc.sizeBytes / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={viewingDocId === doc.id}
                      onClick={() => handleView(doc.id)}
                    >
                      {viewingDocId === doc.id ? "Opening…" : "View"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {viewError && <p className="text-xs text-red-500">{viewError}</p>}

            {editable && (
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-border p-4">
                <div className="space-y-1.5">
                  <Label>Document type</Label>
                  <Select
                    value={documentType}
                    onValueChange={(v) => setDocumentType(v as TherapistDocumentType)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-mindora-purple hover:bg-mindora-purple-pale">
                  {uploadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {uploadMutation.isPending ? "Uploading…" : "Upload document"}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={uploadMutation.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) handleFileSelected(file);
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <ReviewRow label="Full name" value={values.fullName} />
            <ReviewRow label="Phone number" value={values.phoneNumber} />
            <ReviewRow label="Contact email" value={values.contactEmail} />
            <ReviewRow
              label="License"
              value={`${values.licenseNumber} · ${values.licenseIssuingBody}`}
            />
            <ReviewRow label="Years of experience" value={String(values.yearsOfExperience)} />
            <ReviewRow label="Qualifications" value={values.qualifications.join(", ") || "—"} />
            <ReviewRow label="Specialisations" value={values.specialisations.join(", ") || "—"} />
            <ReviewRow label="Languages" value={values.languages.join(", ") || "—"} />
            <ReviewRow label="Location" value={values.location} />
            <ReviewRow label="Documents uploaded" value={String(documents.length)} />

            {submitMutation.isError &&
              !(submitMutation.error instanceof ApiError && submitMutation.error.fieldErrors) && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
                  {submitMutation.error instanceof ApiError
                    ? submitMutation.error.message
                    : "Could not submit your application."}
                </div>
              )}
            {Object.keys(errors).length > 0 && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
                Your application is missing some required information. Please go back and complete
                every step before submitting.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {step < STEP_LABELS.length - 1 ? (
          <Button type="button" onClick={goNext} disabled={updateMutation.isPending || !editable}>
            {updateMutation.isPending ? "Saving…" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!editable || submitMutation.isPending}
          >
            {submitMutation.isPending ? "Submitting…" : "Submit Application"}
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 pb-3 last:border-0">
      <span className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-[14px] text-foreground">{value || "—"}</span>
    </div>
  );
}
