"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MoodEntryFields,
  DEFAULT_MOOD_FIELDS,
  scaleIndexToScore,
  emotionIndexToArray,
  type MoodFieldsValue,
} from "@/components/check-in/MoodEntryFields";
import { useLogMood } from "@/hooks/useMood";
import { ApiError } from "@/lib/api";

function todayLocalDateString(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in the browser's own timezone
}

function minDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 365);
  return d.toLocaleDateString("en-CA");
}

interface BackfillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackfillDialog({ open, onOpenChange }: BackfillDialogProps) {
  const [date, setDate] = useState(todayLocalDateString());
  const [value, setValue] = useState<MoodFieldsValue>(DEFAULT_MOOD_FIELDS);
  const logMoodMutation = useLogMood();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setDate(todayLocalDateString());
      setValue(DEFAULT_MOOD_FIELDS);
      logMoodMutation.reset();
    }
    onOpenChange(next);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.moodIndex === null) return;
    // Midday on the chosen local date, converted to a real instant - keeps the
    // entry landing on the intended calendar day regardless of how the server
    // evaluates "which day" relative to UTC.
    const recordedAt = new Date(`${date}T12:00:00`).toISOString();

    logMoodMutation.mutate(
      {
        moodScore: scaleIndexToScore(value.moodIndex)!,
        energyLevel: scaleIndexToScore(value.feelingIndex),
        emotions: emotionIndexToArray(value.emotionIndex),
        journalNote: value.journalNote || undefined,
        recordedAt,
      },
      {
        onSuccess: () => {
          toast.success(`Logged your check-in for ${date}.`);
          handleOpenChange(false);
        },
      }
    );
  }

  // Same "not really an error" treatment as the main form - backfills count
  // toward today's write cap too, so this is a real, expected outcome here.
  const dailyLimitReached =
    logMoodMutation.error instanceof ApiError && logMoodMutation.error.status === 429;

  const errorMessage =
    !dailyLimitReached && logMoodMutation.error instanceof ApiError
      ? logMoodMutation.error.message
      : !dailyLimitReached && logMoodMutation.isError
        ? "Could not log that day. Please try again."
        : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Log a missed day</DialogTitle>
          <p className="text-[13px] text-muted-foreground">
            Backfilling still counts toward today&apos;s check-in limit.
          </p>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="backfill-date" className="text-[13px] font-medium text-foreground">
              Date
            </label>
            <input
              id="backfill-date"
              type="date"
              value={date}
              min={minDateString()}
              max={todayLocalDateString()}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[14px] text-foreground focus-visible:border-mindora-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mindora-purple/30"
            />
          </div>

          <MoodEntryFields value={value} onChange={setValue} />

          {dailyLimitReached ? (
            <div className="rounded-xl bg-mindora-purple-pale px-4 py-3 text-[13.5px] font-medium text-mindora-purple-dark">
              You&apos;ve reached today&apos;s check-in limit, so this backfill can&apos;t go
              through right now - try again tomorrow.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl bg-red-100 px-4 py-3 text-[13.5px] font-medium text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end gap-2.5 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={logMoodMutation.isPending || dailyLimitReached || value.moodIndex === null}
            >
              {logMoodMutation.isPending
                ? "Logging…"
                : value.moodIndex === null
                  ? "Pick a mood to save"
                  : "Log this day"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
