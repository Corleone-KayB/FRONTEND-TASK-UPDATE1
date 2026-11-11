"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApproveApplicationDialog } from "@/components/admin/ApproveApplicationDialog";
import { RejectApplicationDialog } from "@/components/admin/RejectApplicationDialog";
import { RequestInfoDialog } from "@/components/admin/RequestInfoDialog";
import { SuspendTherapistDialog } from "@/components/admin/SuspendTherapistDialog";
import { useAddTherapistApplicationNote, useAdminTherapistApplication } from "@/hooks/useAdmin";
import { fetchTherapistApplication } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import {
  THERAPIST_APPLICATION_STATUS_BADGE_VARIANT,
  THERAPIST_APPLICATION_STATUS_LABEL,
} from "@/lib/therapist-application";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-[14px] text-foreground">{value || "—"}</span>
    </div>
  );
}

export default function AdminTherapistApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data, isLoading, isError } = useAdminTherapistApplication(id);
  const application = data?.application;

  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [therapistAction, setTherapistAction] = useState<{
    userId: string;
    name: string;
    action: "suspend" | "reactivate";
  } | null>(null);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const addNoteMutation = useAddTherapistApplicationNote();

  async function handleViewDocument(docId: string) {
    if (!application) return;
    setViewError(null);
    setViewingDocId(docId);
    // Open the tab synchronously, still inside the click's call stack -
    // Chromium (and others) treat window.open() as a blocked popup once
    // it's called after an await, even from a real click handler. Point
    // this blank tab at the real URL once the fetch below resolves,
    // rather than calling window.open() a second time post-await (found
    // live: the post-await call opened a tab that never navigated
    // anywhere, no error surfaced either).
    //
    // No "noopener" feature here deliberately - passing it makes
    // window.open() return null (that's the whole point of noopener: no
    // reference back), which would defeat keeping a handle to redirect
    // below. Same live find as above - the first attempt at this fix
    // passed noopener and silently got a null handle every time, falling
    // through to the exact same broken post-await window.open() call
    // this was meant to replace. Get a real handle first, then sever
    // `opener` by hand to keep the same security property.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const detail = await fetchTherapistApplication(application.id);
      const doc = detail.application.documents?.find((d) => d.id === docId);
      if (doc?.url && tab) {
        tab.location.href = doc.url;
      } else if (doc?.url) {
        // Popup was blocked before we even got the URL - try once more
        // directly; if the browser blocks this too, there's nothing left
        // to fall back to short of a same-tab navigation.
        window.open(doc.url, "_blank", "noopener,noreferrer");
      } else {
        tab?.close();
        setViewError("Could not get a link for this document.");
      }
    } catch (err) {
      tab?.close();
      setViewError(err instanceof ApiError ? err.message : "Could not open this document.");
    } finally {
      setViewingDocId(null);
    }
  }

  async function handleAddNote() {
    if (!application || !noteDraft.trim()) return;
    await addNoteMutation.mutateAsync({ id: application.id, note: noteDraft.trim() });
    setNoteDraft("");
  }

  const canReview = application?.status === "SUBMITTED" || application?.status === "UNDER_REVIEW";
  const isApproved = application?.status === "APPROVED";

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-10 lg:py-10">
      <button
        type="button"
        onClick={() => router.push("/admin/therapist-applications")}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-mindora-purple hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to applications
      </button>

      {isError && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
          Could not load this application.
        </div>
      )}

      {isLoading && <div className="h-72 animate-pulse rounded-[26px] bg-white/70" />}

      {application && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="rounded-[26px] bg-white p-7 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-[24px] font-bold tracking-tight text-foreground">
                    {application.fullName || "Untitled application"}
                  </h1>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {application.contactEmail} · {application.phoneNumber}
                  </p>
                </div>
                <Badge variant={THERAPIST_APPLICATION_STATUS_BADGE_VARIANT[application.status]}>
                  {THERAPIST_APPLICATION_STATUS_LABEL[application.status]}
                </Badge>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="License number" value={application.licenseNumber} />
                <Field label="License issuing body" value={application.licenseIssuingBody} />
                <Field
                  label="License expiry"
                  value={
                    application.licenseExpiryDate
                      ? new Date(application.licenseExpiryDate).toLocaleDateString()
                      : ""
                  }
                />
                <Field
                  label="Registration number"
                  value={application.professionalRegistrationNumber ?? ""}
                />
                <Field label="Years of experience" value={String(application.yearsOfExperience)} />
                <Field label="Location" value={application.location} />
                <Field label="Timezone" value={application.timezone} />
                <Field
                  label="Availability"
                  value={application.availabilitySummary ?? "Not specified"}
                />
              </div>

              <div className="mt-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Professional bio
                </span>
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                  {application.professionalBio || "—"}
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <TagListDisplay label="Qualifications" values={application.qualifications} />
                <TagListDisplay label="Certifications" values={application.certifications} />
                <TagListDisplay label="Specialisations" values={application.specialisations} />
                <TagListDisplay label="Languages" values={application.languages} />
              </div>

              <div className="mt-5 grid gap-5 border-t border-border/60 pt-4 sm:grid-cols-3">
                <Field
                  label="Submitted"
                  value={
                    application.submittedAt
                      ? new Date(application.submittedAt).toLocaleString()
                      : "Not submitted"
                  }
                />
                <Field
                  label="Reviewed"
                  value={
                    application.reviewedAt ? new Date(application.reviewedAt).toLocaleString() : "—"
                  }
                />
                <Field label="Reviewed by" value={application.reviewedBy ?? "—"} />
              </div>

              {application.status === "REJECTED" && application.rejectionReason && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-[13px] font-semibold text-red-900">
                    Rejection reason (applicant-visible)
                  </p>
                  <p className="mt-1 text-[14px] text-red-800">{application.rejectionReason}</p>
                </div>
              )}
              {application.status === "MORE_INFORMATION_REQUIRED" &&
                application.infoRequestNote && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[13px] font-semibold text-amber-900">
                      Info requested (applicant-visible)
                    </p>
                    <p className="mt-1 text-[14px] text-amber-800">{application.infoRequestNote}</p>
                  </div>
                )}
            </div>

            <div className="rounded-[26px] bg-white p-7 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
              <h2 className="mb-3 text-[16px] font-bold text-foreground">Documents</h2>
              {(application.documents ?? []).length === 0 ? (
                <p className="text-[13.5px] text-muted-foreground">No documents uploaded.</p>
              ) : (
                <ul className="space-y-2">
                  {application.documents!.map((doc) => (
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
                            {doc.documentType} · {(doc.sizeBytes / 1024).toFixed(0)} KB · Uploaded{" "}
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={viewingDocId === doc.id}
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        {viewingDocId === doc.id ? "Opening…" : "View"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {viewError && <p className="mt-2 text-xs text-red-500">{viewError}</p>}
            </div>

            <div className="rounded-[26px] bg-white p-7 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
              <h2 className="mb-1 flex items-center gap-1.5 text-[16px] font-bold text-foreground">
                <Lock className="h-4 w-4 text-muted-foreground" /> Internal notes
              </h2>
              <p className="mb-3 text-[12px] text-muted-foreground">
                Visible to admins only - never shown to the applicant.
              </p>

              {(application.notes ?? []).length === 0 ? (
                <p className="text-[13.5px] text-muted-foreground">No notes yet.</p>
              ) : (
                <ul className="mb-4 space-y-2.5">
                  {application.notes!.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-2xl px-4 py-3 shadow-[inset_3px_3px_7px_#e3ddf0,inset_-3px_-3px_7px_#fdfbff]"
                    >
                      <p className="text-[13.5px] text-foreground">{note.note}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <Textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value.slice(0, 2000))}
                maxLength={2000}
                placeholder="Add an internal note for other reviewers…"
                className="min-h-[80px]"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  disabled={noteDraft.trim().length === 0 || addNoteMutation.isPending}
                  onClick={handleAddNote}
                >
                  {addNoteMutation.isPending ? "Adding…" : "Add note"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[26px] bg-white p-6 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
              <h2 className="mb-3 text-[14px] font-bold text-foreground">Actions</h2>

              {canReview && (
                <div className="flex flex-col gap-2.5">
                  <Button onClick={() => setApproveTarget(application.id)}>Approve</Button>
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setRejectTarget(application.id)}
                  >
                    Reject
                  </Button>
                  <Button variant="outline" onClick={() => setInfoTarget(application.id)}>
                    Request more info
                  </Button>
                </div>
              )}

              {isApproved && (
                <div className="flex flex-col gap-2.5">
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      setTherapistAction({
                        userId: application.userId,
                        name: application.fullName,
                        action: "suspend",
                      })
                    }
                  >
                    Suspend therapist
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setTherapistAction({
                        userId: application.userId,
                        name: application.fullName,
                        action: "reactivate",
                      })
                    }
                  >
                    Reactivate therapist
                  </Button>
                </div>
              )}

              {!canReview && !isApproved && (
                <p className="text-[13px] text-muted-foreground">
                  No actions available for this application&apos;s current status.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <ApproveApplicationDialog
        applicationId={approveTarget}
        applicantName={application?.fullName}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      />
      <RejectApplicationDialog
        applicationId={rejectTarget}
        applicantName={application?.fullName}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      />
      <RequestInfoDialog
        applicationId={infoTarget}
        applicantName={application?.fullName}
        onOpenChange={(open) => !open && setInfoTarget(null)}
      />
      <SuspendTherapistDialog
        target={therapistAction}
        onOpenChange={(open) => !open && setTherapistAction(null)}
      />
    </div>
  );
}

function TagListDisplay({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {values.length === 0 ? (
          <span className="text-[13px] text-muted-foreground">—</span>
        ) : (
          values.map((v) => (
            <span
              key={v}
              className="rounded-full bg-mindora-purple-pale px-2.5 py-1 text-[11.5px] font-medium text-mindora-purple"
            >
              {v}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
