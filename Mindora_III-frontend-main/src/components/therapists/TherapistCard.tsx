"use client";

import Image from "next/image";
import { Clock, Globe, MapPin, Star } from "lucide-react";
import type { Therapist } from "@/lib/mock-data/therapists";
import { sessionModes, therapistInitials } from "@/lib/mock-data/therapists";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookNowButton } from "@/components/public/BookNowButton";
import Link from "next/link";

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export function TherapistAvatar({
  therapist,
  size = 56,
}: {
  therapist: Pick<Therapist, "name" | "photo">;
  size?: number;
}) {
  if (therapist.photo) {
    return (
      <Image
        src={therapist.photo}
        alt={therapist.name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-mindora-purple text-sm font-bold text-white"
      style={{ width: size, height: size }}
    >
      {therapistInitials(therapist.name)}
    </div>
  );
}

const CARD_TAG_LIMIT = 4;

export function TherapistCard({
  therapist,
  onProfilePage = false,
}: {
  therapist: Therapist;
  onProfilePage?: boolean;
}) {
  const tags = onProfilePage
    ? therapist.specialisations
    : therapist.specialisations.slice(0, CARD_TAG_LIMIT);
  const hiddenTags = therapist.specialisations.length - tags.length;
  const modes = sessionModes(therapist);

  return (
    <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row">
        <TherapistAvatar therapist={therapist} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-[#1A1A1A]">{therapist.name}</h3>
              <p className="text-sm text-[#6B7280]">{therapist.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {therapist.sessions ? (
                <Badge className="gap-1">{therapist.sessions} Sessions</Badge>
              ) : null}
              {therapist.clientsChoice ? (
                <Badge variant="pending">Clients&apos; Choice</Badge>
              ) : null}
            </div>
          </div>

          {therapist.rating !== undefined ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <StarRating rating={therapist.rating} />
              <span className="font-semibold">{therapist.rating}</span>
              {therapist.reviews !== undefined ? (
                <span className="text-[#6B7280]">({therapist.reviews} reviews)</span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#F9F6FF] px-3 py-1 text-xs font-medium text-mindora-purple"
              >
                {tag}
              </span>
            ))}
            {hiddenTags > 0 ? (
              <span className="rounded-full px-3 py-1 text-xs font-medium text-[#6B7280]">
                +{hiddenTags} more
              </span>
            ) : null}
          </div>

          {modes ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-[#6B7280]">
              <MapPin className="h-4 w-4 text-mindora-purple" />
              {modes}
            </p>
          ) : null}

          {therapist.languages?.length ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
              <Globe className="h-4 w-4 text-mindora-purple" />
              {therapist.languages.join(", ")}
            </p>
          ) : null}

          {therapist.nearest ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
              <Clock className="h-4 w-4 text-mindora-purple" />
              Nearest: {therapist.nearest}
            </p>
          ) : null}

          {therapist.price60 !== undefined || therapist.price30 !== undefined ? (
            <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">
              {therapist.price60 !== undefined ? `$${therapist.price60} USD / 60 Min` : null}
              {therapist.price60 !== undefined && therapist.price30 !== undefined
                ? "\u00a0\u00a0 "
                : null}
              {therapist.price30 !== undefined ? `$${therapist.price30} USD / 30 Min` : null}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {onProfilePage ? null : (
              <Button asChild variant="outline" size="sm" className="h-10 sm:flex-1">
                <Link href={`/therapists/${therapist.id}`}>View Profile</Link>
              </Button>
            )}
            <BookNowButton therapistId={therapist.id} className="h-10 sm:flex-1" />
          </div>
        </div>
      </div>
    </article>
  );
}
