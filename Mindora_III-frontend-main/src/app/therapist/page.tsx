"use client";

import { useState } from "react";
import { CalendarX, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoodReportDialog } from "@/components/therapist/MoodReportDialog";
import {
  useCompleteAppointment,
  useConfirmAppointment,
  useTherapistSchedule,
} from "@/hooks/useAppointments";
import type { BookedAppointment } from "@/types/domain";

const STATUS_VARIANT = {
  PENDING: "pending",
  CONFIRMED: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
} as const;

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSessionType(type: BookedAppointment["sessionType"]): string {
  return type === "VIDEO" ? "Video call" : "Audio call";
}

function patientLabel(patientId: string): string {
  return `Patient ${patientId.slice(0, 8)}`;
}

export default function TherapistSchedulePage() {
  const [date, setDate] = useState("");
  const [moodTarget, setMoodTarget] = useState<string | null>(null);

  const { data, isLoading, isError } = useTherapistSchedule(date || undefined);
  const confirmMutation = useConfirmAppointment();
  const completeMutation = useCompleteAppointment();

  const appointments = [...(data?.appointments ?? [])].sort(
    (a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()
  );

  return (
    <div className="min-h-full bg-white px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">Schedule</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">Your upcoming sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[160px]"
          />
          {date && (
            <Button variant="outline" size="sm" onClick={() => setDate("")}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {isError && (
        <div className="mb-4 rounded-[10px] bg-red-100 px-4 py-3 text-[13px] font-semibold text-red-700">
          Could not load your schedule.
        </div>
      )}

      {isLoading ? (
        <p className="py-5 text-[13.5px] text-muted-foreground">Loading your schedule…</p>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-mindora-lavender text-mindora-purple-light">
            <CalendarX className="h-6 w-6" />
          </div>
          <p className="mb-1 text-[15px] font-bold text-foreground">No appointments</p>
          <p className="text-[13.5px] text-muted-foreground">
            {date ? "Nothing scheduled for this date." : "Your schedule is clear for now."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-bold text-foreground">
                  {patientLabel(apt.patientId)}
                </p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {formatSessionType(apt.sessionType)} · {fmtWhen(apt.slotStart)}
                </p>
                {apt.status === "CANCELLED" && apt.cancellationReason && (
                  <p className="mt-0.5 text-[12px] text-red-700">
                    Reason: {apt.cancellationReason}
                  </p>
                )}
              </div>
              <Badge variant={STATUS_VARIANT[apt.status]} className="shrink-0">
                {apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setMoodTarget(apt.patientId)}
              >
                <Heart className="h-3.5 w-3.5" />
                Mood
              </Button>
              {apt.status === "PENDING" && (
                <Button
                  size="sm"
                  className="shrink-0"
                  disabled={confirmMutation.isPending}
                  onClick={() => confirmMutation.mutate(apt.id)}
                >
                  Confirm
                </Button>
              )}
              {apt.status === "CONFIRMED" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  disabled={completeMutation.isPending}
                  onClick={() => completeMutation.mutate(apt.id)}
                >
                  Mark complete
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <MoodReportDialog
        patientId={moodTarget}
        onOpenChange={(open) => !open && setMoodTarget(null)}
      />
    </div>
  );
}
