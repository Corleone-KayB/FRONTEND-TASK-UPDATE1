"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAvailability, useBookAppointment } from "@/hooks/useAppointments";
import type { AvailabilitySlot, SessionType, TherapistProfile } from "@/types/domain";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "VIDEO", label: "Video call" },
  { value: "AUDIO", label: "Audio call" },
];

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const CONFLICT_FALLBACK = "That slot was just booked by someone else - please pick another time.";
const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";
const GENERIC_ERROR = "Could not book this session. Please try again.";

type Step = "select" | "review" | "success";
type Problem = { kind: "conflict" | "network" | "error"; message: string };

interface BookingDialogProps {
  therapist: TherapistProfile | null;
  onOpenChange: (open: boolean) => void;
}

export function BookingDialog({ therapist, onOpenChange }: BookingDialogProps) {
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [problem, setProblem] = useState<Problem | null>(null);

  const {
    data: availability,
    isLoading: slotsLoading,
    isError: slotsError,
    refetch: refetchSlots,
  } = useAvailability(therapist?.userId ?? null);
  const bookMutation = useBookAppointment();

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
    setStep("select");
    setProblem(null);
    bookMutation.reset();
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!therapist || !sessionType || !selectedSlot) return;
    setProblem(null);
    let outcome;
    try {
      outcome = await bookMutation.mutateAsync({
        therapistId: therapist.userId,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
        sessionType,
      });
    } catch {
      outcome = { kind: "error" as const, network: false };
    }
    if (outcome.kind === "success") {
      setStep("success");
    } else if (outcome.kind === "conflict") {
      // The hook already refetched the slots; send the user back to pick another.
      setSelectedSlot(null);
      setStep("select");
      setProblem({ kind: "conflict", message: outcome.message ?? CONFLICT_FALLBACK });
    } else {
      setProblem({
        kind: outcome.network ? "network" : "error",
        message: outcome.network ? NETWORK_ERROR : (outcome.message ?? GENERIC_ERROR),
      });
    }
  }

  const noAvailability = !slotsLoading && !slotsError && dayEntries.length === 0;
  const reviewDisabled = !sessionType || !selectedSlot;
  const reviewLabel = !sessionType
    ? "Choose session type"
    : !selectedSlot
      ? "Select a time"
      : "Review booking";
  const sessionLabel = SESSION_TYPES.find((t) => t.value === sessionType)?.label ?? "";

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

            {step === "select" && (
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

                {slotsError && (
                  <div
                    role="alert"
                    className="mb-5 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700"
                  >
                    <p>Could not load open times. Check your connection and try again.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => refetchSlots()}
                    >
                      Try again
                    </Button>
                  </div>
                )}
                {noAvailability && (
                  <div className="mb-5 rounded-[9px] border border-dashed border-border px-3 py-4 text-center text-[12.5px] text-muted-foreground">
                    <p className="font-semibold text-foreground/80">No open times right now</p>
                    <p>
                      {therapist.userName ?? "This therapist"} has no available slots at the moment.
                      Please check back later or choose another therapist.
                    </p>
                  </div>
                )}

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
                  {!slotsLoading && dayEntries.length > 0 && activeDaySlots.length === 0 && (
                    <span className="text-[12.5px] text-muted-foreground">
                      No open slots this day.
                    </span>
                  )}
                </div>

                {problem?.kind === "conflict" && (
                  <div
                    role="alert"
                    className="mb-3.5 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700"
                  >
                    {problem.message}
                  </div>
                )}

                <div className="flex justify-end border-t border-border pt-4">
                  <Button onClick={() => setStep("review")} disabled={reviewDisabled}>
                    {reviewLabel}
                  </Button>
                </div>
              </div>
            )}

            {step === "review" && selectedSlot && (
              <div>
                <p className="mb-2 text-[12.5px] font-bold tracking-wide text-popover-foreground/75 uppercase">
                  Review your booking
                </p>
                <dl className="mb-4 divide-y divide-border rounded-[10px] border border-border text-[13px]">
                  {[
                    ["Therapist", therapist.userName ?? "Therapist"],
                    ["Session type", sessionLabel],
                    ["Date", fmtDate(selectedSlot.slotStart)],
                    [
                      "Time",
                      `${fmtTime(selectedSlot.slotStart)} - ${fmtTime(selectedSlot.slotEnd)}`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 px-3 py-2.5">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>

                {problem && problem.kind !== "conflict" && (
                  <div
                    role="alert"
                    className="mb-3.5 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700"
                  >
                    {problem.message}
                  </div>
                )}

                <div className="flex justify-between gap-2 border-t border-border pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProblem(null);
                      setStep("select");
                    }}
                    disabled={bookMutation.isPending}
                  >
                    Back
                  </Button>
                  <Button onClick={handleConfirm} disabled={bookMutation.isPending}>
                    {bookMutation.isPending
                      ? "Booking…"
                      : problem
                        ? "Try again"
                        : "Confirm booking"}
                  </Button>
                </div>
              </div>
            )}

            {step === "success" && selectedSlot && (
              <div className="text-center" role="status">
                <CheckCircle2
                  className="mx-auto mb-3 h-12 w-12 text-green-600"
                  aria-hidden="true"
                />
                <p className="mb-1 text-[16px] font-bold">Booking requested</p>
                <p className="mb-4 text-[13px] text-muted-foreground">
                  {sessionLabel} with {therapist.userName ?? "your therapist"} on{" "}
                  {fmtDate(selectedSlot.slotStart)} at {fmtTime(selectedSlot.slotStart)}. Status:
                  pending therapist confirmation.
                </p>
                <Button onClick={() => handleOpenChange(false)}>Done</Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
