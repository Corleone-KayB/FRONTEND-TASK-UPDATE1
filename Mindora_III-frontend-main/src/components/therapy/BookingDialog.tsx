"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useAvailability, useBookAppointment } from "@/hooks/useAppointments";
import type { AvailabilitySlot, SessionType, TherapistProfile } from "@/types/domain";
import { cn } from "@/lib/utils";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "VIDEO", label: "Video call" },
  { value: "AUDIO", label: "Audio call" },
];

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

interface BookingDialogProps {
  therapist: TherapistProfile | null;
  onOpenChange: (open: boolean) => void;
}

export function BookingDialog({ therapist, onOpenChange }: BookingDialogProps) {
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const { data: availability, isLoading: slotsLoading } = useAvailability(
    therapist?.userId ?? null
  );
  const bookMutation = useBookAppointment();
  const queryClient = useQueryClient();

  const dayEntries = useMemo(() => {
    const byDay = new Map<string, { date: Date; slots: AvailabilitySlot[] }>();
    (availability?.slots ?? []).forEach((slot) => {
      const date = new Date(slot.slotStart);
      const key = date.toDateString();
      if (!byDay.has(key)) byDay.set(key, { date, slots: [] });
      byDay.get(key)!.slots.push(slot);
    });
    return Array.from(byDay.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [availability]);

  const activeDateKey = selectedDateKey ?? dayEntries[0]?.date.toDateString() ?? null;
  const activeDaySlots =
    dayEntries.find((d) => d.date.toDateString() === activeDateKey)?.slots ?? [];

  function reset() {
    setSessionType(null);
    setSelectedDateKey(null);
    setSelectedSlot(null);
    bookMutation.reset();
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!therapist || !sessionType || !selectedSlot) return;
    try {
      await bookMutation.mutateAsync({
        therapistId: therapist.userId,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
        sessionType,
      });
      handleOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSelectedSlot(null);
        queryClient.invalidateQueries({ queryKey: ["availability", therapist.userId] });
      }
    }
  }

  const confirmDisabled = !sessionType || !selectedSlot || bookMutation.isPending;
  const confirmLabel = bookMutation.isPending
    ? "Booking…"
    : !sessionType
      ? "Choose session type"
      : !selectedSlot
        ? "Select a time"
        : "Confirm booking";

  return (
    <Dialog open={!!therapist} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[440px]">
        {therapist && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mindora-purple text-sm font-bold text-white">
                  {(therapist.userName ?? "?")
                    .split(" ")
                    .slice(-2)
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div>
                  <DialogTitle>{therapist.userName ?? "Therapist"}</DialogTitle>
                  <p className="text-[12.5px] text-muted-foreground">{therapist.specialisation}</p>
                </div>
              </div>
            </DialogHeader>

            <div>
              <p className="mb-2 text-[12.5px] font-bold tracking-wide text-popover-foreground/75 uppercase">
                Session type
              </p>
              <div className="mb-5 flex gap-2">
                {SESSION_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSessionType(opt.value)}
                    className={cn(
                      "flex-1 rounded-[10px] border px-1.5 py-2.5 text-[12.5px] font-bold",
                      sessionType === opt.value
                        ? "border-mindora-purple bg-mindora-purple text-white"
                        : "border-border bg-background text-foreground/80"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <p className="mb-2 text-[12.5px] font-bold tracking-wide text-popover-foreground/75 uppercase">
                Select a date
              </p>
              <div className="mb-5 flex gap-2 overflow-x-auto">
                {dayEntries.map((entry) => {
                  const key = entry.date.toDateString();
                  const selected = activeDateKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedDateKey(key);
                        setSelectedSlot(null);
                      }}
                      className={cn(
                        "flex w-13 shrink-0 flex-col items-center gap-0.5 rounded-[11px] border py-2.5",
                        selected
                          ? "border-mindora-purple bg-mindora-purple text-white"
                          : "border-border bg-background text-foreground/80"
                      )}
                    >
                      <span className="text-[10.5px] font-semibold opacity-80">
                        {WEEKDAY[entry.date.getDay()]}
                      </span>
                      <span className="text-[15px] font-bold">{entry.date.getDate()}</span>
                    </button>
                  );
                })}
              </div>

              <p className="mb-1 text-[12.5px] font-bold tracking-wide text-popover-foreground/75 uppercase">
                Select a time
              </p>
              <p className="mb-2 text-[11.5px] text-popover-foreground/50">
                Sessions run 50 minutes. Times shown are start times.
              </p>
              <div className="mb-3.5 flex flex-wrap gap-2">
                {activeDaySlots.map((slot) => {
                  const selected = selectedSlot?.slotStart === slot.slotStart;
                  return (
                    <button
                      key={slot.slotStart}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "rounded-[9px] border px-3.5 py-2 text-[13px] font-semibold",
                        selected
                          ? "border-mindora-purple bg-mindora-purple-pale text-mindora-purple-dark"
                          : "border-border bg-background text-foreground/80"
                      )}
                    >
                      {fmtTime(slot.slotStart)}
                    </button>
                  );
                })}
                {slotsLoading && (
                  <span className="text-[12.5px] text-muted-foreground">Loading open slots…</span>
                )}
                {!slotsLoading && activeDaySlots.length === 0 && (
                  <span className="text-[12.5px] text-muted-foreground">
                    No open slots this day.
                  </span>
                )}
              </div>

              {bookMutation.isError && (
                <div className="mb-3.5 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
                  {bookMutation.error instanceof ApiError && bookMutation.error.status === 409
                    ? "That slot was just booked by someone else - please pick another time."
                    : (bookMutation.error?.message ?? "Could not book this session.")}
                </div>
              )}

              <div className="flex justify-end border-t border-border pt-4">
                <Button onClick={handleConfirm} disabled={confirmDisabled}>
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
