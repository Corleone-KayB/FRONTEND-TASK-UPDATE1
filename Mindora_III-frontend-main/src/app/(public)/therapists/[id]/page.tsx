import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { BackLink } from "@/components/public/BackLink";
import { getTherapistById, sessionModes, THERAPISTS } from "@/lib/mock-data/therapists";
import { TherapistCard } from "@/components/therapists/TherapistCard";

export function generateStaticParams() {
  return THERAPISTS.map((therapist) => ({ id: therapist.id }));
}

export default async function TherapistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const therapist = getTherapistById(id);
  if (!therapist) notFound();

  const modes = sessionModes(therapist);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <BackLink fallback="/therapists" className="mb-6" />
      <h1 className="sr-only">{therapist.name}</h1>
      <TherapistCard therapist={therapist} onProfilePage />

      {therapist.bio?.length ? (
        <section className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1A1A1A]">About</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#4B5563]">
            {therapist.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 rounded-xl border border-border bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">Approaches</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[#4B5563]">
            {therapist.specialisations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <div className="space-y-5">
          {therapist.languages?.length ? (
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">Languages</h2>
              <p className="mt-2 text-sm text-[#4B5563]">{therapist.languages.join(", ")}</p>
            </div>
          ) : null}
          {modes ? (
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">Sessions</h2>
              <p className="mt-2 text-sm text-[#4B5563]">{modes}</p>
            </div>
          ) : null}
          {therapist.phone || therapist.email ? (
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">Contact</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {therapist.phone ? (
                  <li>
                    <a
                      href={`tel:${therapist.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-2 text-mindora-purple hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {therapist.phone}
                    </a>
                  </li>
                ) : null}
                {therapist.email ? (
                  <li>
                    <a
                      href={`mailto:${therapist.email}`}
                      className="inline-flex items-center gap-2 break-all text-mindora-purple hover:underline"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      {therapist.email}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
