"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { BackLink } from "@/components/public/BackLink";
import { BookingDialog } from "@/components/therapy/BookingDialog";
import { TherapistNotFound } from "@/components/therapists/TherapistNotFound";
import { useTherapists } from "@/hooks/useTherapists";

// Landing page for "Book" on a public therapist. (app)/layout's RouteGuard has
// already sent logged-out users to /login?returnUrl=<this path>, so by the time
// this renders the user is logged in and the real list endpoint is available.
// `id` is TherapistProfile.userId. Closing the dialog goes back to the list.
export default function BookAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError } = useTherapists({});
  const therapist = data?.therapists.find((item) => item.userId === id) ?? null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <BackLink fallback="/therapists" className="mb-4" />
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-[#F9F6FF]" aria-busy="true" />
      ) : therapist ? (
        <>
          <h1 className="text-2xl font-bold">
            Book a session with {therapist.userName ?? "your therapist"}
          </h1>
          <BookingDialog
            therapist={therapist}
            onOpenChange={(open) => {
              if (!open) router.push("/therapy");
            }}
          />
        </>
      ) : (
        <TherapistNotFound listHref="/therapy" loadFailed={isError} />
      )}
    </div>
  );
}
