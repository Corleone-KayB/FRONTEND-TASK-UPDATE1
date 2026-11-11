"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TherapistApplicationForm } from "@/components/therapist-application/TherapistApplicationForm";
import { useCreateTherapistApplication } from "@/hooks/useTherapistApplication";
import { ApiError } from "@/lib/api";
import type { TherapistApplication } from "@/types/domain";

// Landing here always calls the create-or-resume endpoint: the backend itself
// decides whether to hand back a fresh DRAFT or an existing editable one, so
// both "start a new application" and "continue/edit" links point here.
export default function NewTherapistApplicationPage() {
  const createMutation = useCreateTherapistApplication();
  const [application, setApplication] = useState<TherapistApplication | null>(null);
  const [pendingNotice, setPendingNotice] = useState<TherapistApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    createMutation
      .mutateAsync()
      .then(({ application }) => setApplication(application))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 409) {
          const pending = (err.body as { application?: TherapistApplication } | undefined)
            ?.application;
          if (pending) {
            setPendingNotice(pending);
            return;
          }
        }
        setError(err instanceof ApiError ? err.message : "Could not start your application.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <Link
          href="/therapist-application"
          className="text-[13px] font-semibold text-mindora-purple hover:underline"
        >
          ← Back to application status
        </Link>
        <h1 className="mt-2 text-[28px] font-bold tracking-tight text-foreground">
          Therapist Application
        </h1>
      </div>

      {pendingNotice && (
        <div className="mx-auto max-w-[760px] rounded-2xl bg-mindora-pending-bg px-4 py-3.5 text-[13.5px] font-semibold text-mindora-purple">
          You already have an application that&apos;s{" "}
          {pendingNotice.status === "SUBMITTED" ? "submitted" : "under review"} and can&apos;t be
          edited right now.{" "}
          <Link href="/therapist-application" className="underline">
            View its status
          </Link>
          .
        </div>
      )}

      {error && !pendingNotice && (
        <div className="mx-auto max-w-[760px] rounded-2xl bg-red-50 px-4 py-3.5 text-[13.5px] font-semibold text-red-700">
          {error}
        </div>
      )}

      {!application && !pendingNotice && !error && (
        <div className="mx-auto h-64 max-w-[760px] animate-pulse rounded-[26px] bg-white/70" />
      )}

      {application && <TherapistApplicationForm application={application} />}
    </div>
  );
}
