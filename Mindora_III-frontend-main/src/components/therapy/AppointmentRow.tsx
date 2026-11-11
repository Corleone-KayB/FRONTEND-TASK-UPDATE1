"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookedAppointment } from "@/types/domain";

const STATUS_VARIANT = {
  PENDING: "pending",
  CONFIRMED: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
} as const;

const STATUS_LABEL: Record<BookedAppointment["status"], string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function formatSessionType(type: BookedAppointment["sessionType"]): string {
  return type === "VIDEO" ? "Video call" : "Audio call";
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter((w) => w[0] === w[0].toUpperCase())
    .slice(-2)
    .map((w) => w[0])
    .join("");
}

interface AppointmentRowProps {
  appointment: BookedAppointment;
  therapistName: string;
  therapistPhotoUrl?: string | null;
  onCancel: () => void;
  onRate: () => void;
}

export function AppointmentRow({
  appointment,
  therapistName,
  therapistPhotoUrl,
  onCancel,
  onRate,
}: AppointmentRowProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = !!therapistPhotoUrl && !photoFailed;
  const showCancel = appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const showRateButton = appointment.status === "COMPLETED" && !appointment.rating;
  const showRatingGiven = appointment.status === "COMPLETED" && !!appointment.rating;

  return (
    <div className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0">
      {showPhoto ? (
        <img
          src={therapistPhotoUrl!}
          alt={therapistName}
          loading="lazy"
          onError={() => setPhotoFailed(true)}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mindora-purple text-[13px] font-bold text-white">
          {initialsFor(therapistName)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-bold text-foreground">{therapistName}</div>
        <div className="mt-0.5 text-[12.5px] text-muted-foreground">
          {formatSessionType(appointment.sessionType)} · {fmtWhen(appointment.slotStart)}
        </div>
        {appointment.status === "CANCELLED" && appointment.cancellationReason && (
          <div className="mt-0.5 text-[12px] text-red-700">
            Reason: {appointment.cancellationReason}
          </div>
        )}
        {showRatingGiven && (
          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-amber-600">
            You rated {appointment.rating}
            <Star className="h-3 w-3" fill="currentColor" />
          </div>
        )}
      </div>
      <Badge variant={STATUS_VARIANT[appointment.status]} className="shrink-0">
        {STATUS_LABEL[appointment.status]}
      </Badge>
      {showCancel && (
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold text-destructive",
            "shadow-[3px_3px_7px_#cdc6e0,-3px_-3px_7px_#fdfbff]"
          )}
        >
          Cancel
        </button>
      )}
      {showRateButton && (
        <button
          type="button"
          onClick={onRate}
          className="shrink-0 rounded-full bg-mindora-purple-pale px-3.5 py-2 text-[12.5px] font-semibold text-mindora-purple-dark shadow-[3px_3px_7px_#cdc6e0,-3px_-3px_7px_#fdfbff]"
        >
          Rate session
        </button>
      )}
    </div>
  );
}
