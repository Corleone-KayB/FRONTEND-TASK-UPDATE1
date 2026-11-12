import Link from "next/link";
import { Button } from "@/components/ui/button";

// Shown when a therapist id cannot be resolved (unknown id, not accepting patients,
// or the list could not be loaded). Always offers a way back to the list.
export function TherapistNotFound({
  listHref,
  loginHref,
  loadFailed = false,
}: {
  listHref: string;
  loginHref?: string;
  loadFailed?: boolean;
}) {
  return (
    <div role="alert" className="rounded-xl border border-border bg-[#F9F6FF] p-8 text-center">
      <h1 className="text-xl font-bold text-[#1A1A1A]">
        {loadFailed ? "We couldn't load this therapist" : "Therapist not found"}
      </h1>
      <p className="mt-2 text-sm text-[#6B7280]">
        {loadFailed
          ? "Check your connection and try again, or pick someone from the list."
          : "This therapist may no longer be accepting patients, or the link is out of date."}
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Button asChild className="h-11">
          <Link href={listHref}>Back to therapists</Link>
        </Button>
        {loginHref ? (
          <Button asChild variant="outline" className="h-11">
            <Link href={loginHref}>Log in to see all therapists</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
