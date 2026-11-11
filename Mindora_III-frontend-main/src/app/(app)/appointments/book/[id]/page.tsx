import { notFound } from "next/navigation";
import { BackLink } from "@/components/public/BackLink";
import { getTherapistById, THERAPISTS } from "@/lib/mock-data/therapists";
import { TherapistAvatar } from "@/components/therapists/TherapistCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function generateStaticParams() {
  return THERAPISTS.map((therapist) => ({ id: therapist.id }));
}

export default async function BookAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const therapist = getTherapistById(id);
  if (!therapist) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <BackLink fallback="/therapists" className="mb-4" />
      <p className="text-sm text-[#6B7280]">Booking</p>
      <div className="mt-4 flex items-center gap-3">
        <TherapistAvatar therapist={therapist} size={48} />
        <div>
          <h1 className="text-2xl font-bold">{therapist.name}</h1>
          <p className="text-sm text-[#6B7280]">{therapist.title}</p>
        </div>
      </div>
      <p className="mt-6 rounded-xl bg-[#F9F6FF] p-4 text-sm leading-relaxed text-[#6B7280]">
        Session booking will connect to the appointments service soon.
        {therapist.nearest ? ` Nearest open time: ${therapist.nearest}.` : null}
      </p>
      <Button asChild className="mt-6">
        <Link href="/therapists">Back to therapists</Link>
      </Button>
    </div>
  );
}
