import { BackLink } from "@/components/public/BackLink";
import { PublicTherapistProfile } from "@/components/therapists/PublicTherapistProfile";

export default async function TherapistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <BackLink fallback="/therapists" className="mb-6" />
      <PublicTherapistProfile id={id} />
    </div>
  );
}
