"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTherapistTimeOff } from "@/hooks/useAppointments";
import { validateTimeOffRange } from "@/lib/availability";
import { ApiError } from "@/lib/api";

interface TimeOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Dates come from plain <input type="date"> pickers (whole days), converted
// to the midnight-UTC ISO datetime the backend expects. The end date is
// exclusive - the block runs up to the start of that day - so "July 1
// through July 2 off" is entered as start=July 1, end=July 3.
function dateToIsoMidnight(date: string): string {
  return `${date}T00:00:00.000Z`;
}

export function TimeOffDialog({ open, onOpenChange }: TimeOffDialogProps) {
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const mutation = useCreateTherapistTimeOff();

  function reset() {
    setStartsAt("");
    setEndsAt("");
    setReason("");
    setLocalError(null);
    mutation.reset();
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit() {
    setLocalError(null);
    if (!startsAt || !endsAt) {
      setLocalError("Pick a start and end date.");
      return;
    }
    const startIso = dateToIsoMidnight(startsAt);
    const endIso = dateToIsoMidnight(endsAt);
    const validationError = validateTimeOffRange(startIso, endIso);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      await mutation.mutateAsync({
        startsAt: startIso,
        endsAt: endIso,
        reason: reason.trim() || undefined,
      });
      handleOpenChange(false);
    } catch {
      // Surfaced below via mutation.isError/mutation.error - nothing more to do here.
    }
  }

  const fieldErrors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add time off</DialogTitle>
          <p className="text-[13px] text-muted-foreground">
            Patients won&apos;t be able to book sessions with you during this range.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="time-off-start" className="mb-2 block text-[12.5px] font-bold">
                Start date
              </Label>
              <Input
                id="time-off-start"
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
              {fieldErrors?.startsAt && (
                <p className="mt-1 text-[11.5px] text-red-700">{fieldErrors.startsAt[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="time-off-end" className="mb-2 block text-[12.5px] font-bold">
                End date
              </Label>
              <Input
                id="time-off-end"
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
              {fieldErrors?.endsAt && (
                <p className="mt-1 text-[11.5px] text-red-700">{fieldErrors.endsAt[0]}</p>
              )}
            </div>
          </div>
          <p className="-mt-2 text-[11.5px] text-muted-foreground">
            Runs through the end of the day before your end date.
          </p>

          <div>
            <Label htmlFor="time-off-reason" className="mb-2 block text-[12.5px] font-bold">
              Reason (optional)
            </Label>
            <Input
              id="time-off-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Vacation"
              maxLength={200}
            />
          </div>

          {(localError || (mutation.isError && !fieldErrors)) && (
            <div className="rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
              {localError ?? mutation.error?.message ?? "Could not add this time off."}
            </div>
          )}

          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add time off"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
