"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { TherapistProfile } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useDominantColor, isLightColor } from "@/hooks/useDominantColor";

const CARD_PALETTE = [
  { bg: "bg-mindora-purple-dark", light: false },
  { bg: "bg-mindora-purple", light: false },
  { bg: "bg-mindora-purple-light", light: true },
];

function initialsFor(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter((w) => w[0] === w[0].toUpperCase())
    .slice(-2)
    .map((w) => w[0])
    .join("");
}

interface TherapistCardProps {
  therapist: TherapistProfile;
  index: number;
  onBook: () => void;
}

export function TherapistCard({ therapist, index, onBook }: TherapistCardProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = !!therapist.photoUrl && !photoFailed;

  // Tint the card to match the photo's own backdrop color. Falls back to the
  // cycling purple palette if there's no photo, or if the image can't be
  // sampled (e.g. the server doesn't send CORS headers for cross-origin reads).
  const sampledColor = useDominantColor(showPhoto ? therapist.photoUrl! : null);
  const fallback = CARD_PALETTE[index % CARD_PALETTE.length];
  const bgStyle = sampledColor ? { backgroundColor: sampledColor } : undefined;
  const bgClass = sampledColor ? undefined : fallback.bg;
  const isLight = sampledColor ? isLightColor(sampledColor) : fallback.light;
  const textClass = isLight ? "text-mindora-purple-dark" : "text-white";

  return (
    <div className="group aspect-[3/4] [perspective:1000px]">
      <div className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]">
        {/* FRONT - photo + name */}
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-[20px] shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff] [backface-visibility:hidden]">
          <div className={cn("relative min-h-0 flex-1", bgClass)} style={bgStyle}>
            {showPhoto ? (
              <img
                src={therapist.photoUrl!}
                alt={therapist.userName ?? "Therapist"}
                loading="lazy"
                onError={() => setPhotoFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center text-4xl font-bold",
                  textClass
                )}
              >
                {initialsFor(therapist.userName)}
              </span>
            )}
          </div>
          <div className={cn("p-4 text-center", bgClass, textClass)} style={bgStyle}>
            <div className="font-serif text-[19px] font-bold">
              {therapist.userName ?? "Therapist"}
            </div>
          </div>
        </div>

        {/* BACK - specialisation, languages, status, booking */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-[20px] p-6 text-center shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff] [backface-visibility:hidden] [transform:rotateY(180deg)]",
            bgClass,
            textClass
          )}
          style={bgStyle}
        >
          <span
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-bold whitespace-nowrap",
              therapist.isAcceptingPatients
                ? "bg-white/90 text-mindora-success"
                : "bg-black/75 text-white"
            )}
          >
            {therapist.isAcceptingPatients ? "Accepting patients" : "Not accepting"}
          </span>

          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="font-serif text-2xl font-bold">{therapist.userName ?? "Therapist"}</div>
            <div className="text-[15px] font-bold tracking-wide uppercase opacity-85">
              {therapist.specialisation ?? "General practice"}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {therapist.languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-white/55 px-3 py-1 text-[13px] font-semibold text-current"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onBook}
            disabled={!therapist.isAcceptingPatients}
            className={cn(
              "flex items-center gap-1.5 text-[15px] font-bold",
              therapist.isAcceptingPatients
                ? "cursor-pointer hover:underline"
                : "cursor-not-allowed opacity-50"
            )}
          >
            {therapist.isAcceptingPatients ? "Get started" : "Not accepting patients"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
