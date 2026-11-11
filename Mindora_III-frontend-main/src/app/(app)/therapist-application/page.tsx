"use client";

import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMyTherapistApplications } from "@/hooks/useTherapistApplication";
import {
  THERAPIST_APPLICATION_STATUS_BADGE_VARIANT,
  THERAPIST_APPLICATION_STATUS_LABEL,
} from "@/lib/therapist-application";
import type { TherapistApplication } from "@/types/domain";

export default function TherapistApplicationPage() {
  const { data, isLoading, isError } = useMyTherapistApplications();
  const latest = data?.applications[0] ?? null;

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Become a Therapist</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Join Mindora&apos;s network of licensed therapists supporting patients across Rwanda.
        </p>
      </div>

      {isError && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
          Could not load your application status.
        </div>
      )}

      {isLoading ? (
        <div className="h-56 animate-pulse rounded-[26px] bg-white/70" />
      ) : (
        <div className="overflow-hidden rounded-[26px] bg-white p-8 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
          {!latest ? <NoApplicationState /> : <StatusPanel application={latest} />}
        </div>
      )}
    </div>
  );
}

function NoApplicationState() {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-mindora-purple-pale">
        <HeartHandshake className="h-8 w-8 text-mindora-purple" />
      </div>
      <div>
        <h2 className="text-[20px] font-bold text-foreground">Share your expertise</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-[14px] leading-relaxed text-muted-foreground">
          Tell us about your credentials, licensing, and experience. Our review team checks every
          application before granting therapist access.
        </p>
      </div>
      <Button asChild size="lg" className="mt-2">
        <Link href="/therapist-application/new">Start your application</Link>
      </Button>
    </div>
  );
}

function StatusPanel({ application }: { application: TherapistApplication }) {
  const badge = (
    <Badge variant={THERAPIST_APPLICATION_STATUS_BADGE_VARIANT[application.status]}>
      {THERAPIST_APPLICATION_STATUS_LABEL[application.status]}
    </Badge>
  );

  switch (application.status) {
    case "DRAFT":
      return (
        <div className="flex flex-col items-start gap-3">
          {badge}
          <h2 className="text-[20px] font-bold text-foreground">Continue your application</h2>
          <p className="text-[14px] text-muted-foreground">
            You&apos;re partway through - pick up right where you left off.
          </p>
          <Summary application={application} />
          <Button asChild className="mt-2">
            <Link href="/therapist-application/new">Continue application</Link>
          </Button>
        </div>
      );

    case "SUBMITTED":
    case "UNDER_REVIEW":
      return (
        <div className="flex flex-col items-start gap-3">
          {badge}
          <h2 className="text-[20px] font-bold text-foreground">
            Your application is being reviewed
          </h2>
          <p className="text-[14px] text-muted-foreground">
            {application.submittedAt &&
              `Submitted on ${new Date(application.submittedAt).toLocaleDateString()}. `}
            We&apos;ll notify you as soon as a decision is made. No changes can be made while
            it&apos;s pending.
          </p>
          <Summary application={application} />
        </div>
      );

    case "MORE_INFORMATION_REQUIRED":
      return (
        <div className="flex flex-col items-start gap-3">
          {badge}
          <h2 className="text-[20px] font-bold text-foreground">We need a bit more information</h2>
          <p className="text-[14px] text-muted-foreground">
            Our review team needs more detail before they can continue. Please review your
            application, fill in anything that&apos;s missing or unclear, and resubmit.
          </p>
          {application.infoRequestNote && (
            <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-[13px] font-semibold text-amber-900">What they asked for</p>
              <p className="mt-1 text-[14px] text-amber-800">{application.infoRequestNote}</p>
            </div>
          )}
          <Summary application={application} />
          <Button asChild className="mt-2">
            <Link href="/therapist-application/new">Update application</Link>
          </Button>
        </div>
      );

    case "REJECTED":
      return (
        <div className="flex flex-col items-start gap-3">
          {badge}
          <h2 className="text-[20px] font-bold text-foreground">Application not approved</h2>
          <p className="text-[14px] text-muted-foreground">
            {application.rejectionReason
              ? "Your application wasn't approved this time."
              : "Your application wasn't approved this time. If you'd like more detail, please reach out to our support team."}
          </p>
          {application.rejectionReason && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-[13px] font-semibold text-red-900">Reason</p>
              <p className="mt-1 text-[14px] text-red-800">{application.rejectionReason}</p>
            </div>
          )}
          <Button asChild className="mt-2">
            <Link href="/therapist-application/new">Start a new application</Link>
          </Button>
        </div>
      );

    case "APPROVED":
      return (
        <div className="flex flex-col items-start gap-3">
          {badge}
          <h2 className="text-[20px] font-bold text-foreground">
            Congratulations - you&apos;re a Mindora therapist!
          </h2>
          <p className="text-[14px] text-muted-foreground">
            Your application has been approved. Head over to your therapist dashboard to set your
            availability and start accepting patients.
          </p>
          <Button asChild className="mt-2">
            <Link href="/therapist">Go to your therapist dashboard</Link>
          </Button>
        </div>
      );

    default:
      return null;
  }
}

function Summary({ application }: { application: TherapistApplication }) {
  return (
    <div className="mt-1 w-full rounded-2xl px-4 py-3.5 shadow-[inset_3px_3px_7px_#e3ddf0,inset_-3px_-3px_7px_#fdfbff]">
      <p className="text-[13.5px] font-semibold text-foreground">{application.fullName || "—"}</p>
      <p className="mt-0.5 text-[12px] text-muted-foreground">
        {application.licenseNumber
          ? `License ${application.licenseNumber}`
          : "License number not set yet"}
        {" · "}
        Last updated {new Date(application.updatedAt).toLocaleDateString()}
      </p>
    </div>
  );
}
