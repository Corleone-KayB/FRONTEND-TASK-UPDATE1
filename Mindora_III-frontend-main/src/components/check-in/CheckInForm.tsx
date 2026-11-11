"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import {
  MoodEntryFields,
  DEFAULT_MOOD_FIELDS,
  scaleIndexToScore,
  scoreToScaleIndex,
  emotionIndexToArray,
  emotionsArrayToIndex,
  type MoodFieldsValue,
} from "@/components/check-in/MoodEntryFields";
import { TodaysCheckIns } from "@/components/check-in/TodaysCheckIns";
import { BackfillDialog } from "@/components/check-in/BackfillDialog";
import { ApiError } from "@/lib/api";
import { useLogMood, useMoodToday, useUpdateMoodEntry } from "@/hooks/useMood";
import type { MoodEntry } from "@/types/domain";

function fieldsFromEntry(entry: MoodEntry): MoodFieldsValue {
  return {
    moodIndex: scoreToScaleIndex(entry.moodScore),
    emotionIndex: emotionsArrayToIndex(entry.emotions),
    feelingIndex: scoreToScaleIndex(entry.energyLevel),
    journalNote: entry.journalNote ?? "",
  };
}

export function CheckInForm() {
  const [value, setValue] = useState<MoodFieldsValue>(DEFAULT_MOOD_FIELDS);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [backfillOpen, setBackfillOpen] = useState(false);

  const { data: today } = useMoodToday();
  const logMoodMutation = useLogMood();
  const updateMutation = useUpdateMoodEntry();
  const activeMutation = editingEntry ? updateMutation : logMoodMutation;

  function startEdit(entry: MoodEntry) {
    setEditingEntry(entry);
    setValue(fieldsFromEntry(entry));
    setSubmitted(false);
    logMoodMutation.reset();
    updateMutation.reset();
  }

  function cancelEdit() {
    setEditingEntry(null);
    setValue(DEFAULT_MOOD_FIELDS);
    updateMutation.reset();
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(false);
    // Mood is the one scale with nowhere to hide - moodScore is a required
    // field on both create and (once we're always sending it) update, unlike
    // Emotion/Feeling which the backend has no dedicated field for anyway.
    if (value.moodIndex === null) return;
    const moodScore = scaleIndexToScore(value.moodIndex)!;

    if (editingEntry) {
      updateMutation.mutate(
        {
          id: editingEntry.id,
          body: {
            moodScore,
            energyLevel: scaleIndexToScore(value.feelingIndex),
            // WYSIWYG, same as journalNote below: an explicit [] clears it -
            // there's no dedicated "leave unchanged" gesture in this picker UI.
            emotions: emotionIndexToArray(value.emotionIndex) ?? [],
            // An emptied textarea means "clear the note," not "leave it
            // alone" - the field is visibly editable, so what's shown is
            // what gets saved. undefined (leave-as-is) only ever applies to
            // fields this form doesn't touch, which isn't the case here.
            journalNote: value.journalNote.trim() === "" ? null : value.journalNote,
          },
        },
        {
          onSuccess: () => {
            setSubmitted(true);
            setEditingEntry(null);
            setValue(DEFAULT_MOOD_FIELDS);
          },
        }
      );
    } else {
      logMoodMutation.mutate(
        {
          moodScore,
          energyLevel: scaleIndexToScore(value.feelingIndex),
          emotions: emotionIndexToArray(value.emotionIndex),
          journalNote: value.journalNote || undefined,
        },
        { onSuccess: () => setSubmitted(true) }
      );
    }
  };

  // The daily-limit case isn't really a failure - the patient checked in 10
  // times today, which is engagement, not an error - so it gets its own calm
  // treatment instead of sharing the red error box with real failures.
  const dailyLimitReached =
    activeMutation.error instanceof ApiError && activeMutation.error.status === 429;

  const errorMessage =
    !dailyLimitReached && activeMutation.error instanceof ApiError
      ? activeMutation.error.message
      : !dailyLimitReached && activeMutation.isError
        ? "Could not save your check-in. Please try again."
        : null;

  const atDailyLimit = today ? today.remainingToday <= 0 : false;
  // Editing an existing entry doesn't consume a new write, so the cap only
  // blocks new check-ins and backfills, not saving edits to what's already there.
  const submitBlocked = !editingEntry && (dailyLimitReached || atDailyLimit);
  const answeredCount = [value.moodIndex, value.emotionIndex, value.feelingIndex].filter(
    (i) => i !== null
  ).length;
  const moodMissing = value.moodIndex === null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="space-y-6">
        <form
          onSubmit={onSubmit}
          className="space-y-8 rounded-[34px] bg-white p-7 shadow-[12px_12px_26px_#cbc4de,-12px_-12px_26px_#fdfbff] lg:p-9"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[32px] font-bold tracking-tight">
                {editingEntry ? "Edit check-in" : "Today's check-in"}
              </h1>
              <p className="mt-2 text-[14px] text-muted-foreground">
                {editingEntry ? "Update this entry." : "Pick the face that fits."}
              </p>
              {!editingEntry && today && (
                <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                  {today.remainingToday > 0
                    ? `${today.remainingToday} check-in${today.remainingToday === 1 ? "" : "s"} left today`
                    : "You've reached today's check-in limit"}
                </p>
              )}
            </div>
            {!editingEntry && (
              <button
                type="button"
                onClick={() => setBackfillOpen(true)}
                disabled={atDailyLimit}
                className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-mindora-purple-dark shadow-[5px_5px_12px_#cdc6e0,-5px_-5px_12px_#fdfbff] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Log a missed day
              </button>
            )}
          </div>

          <MoodEntryFields value={value} onChange={setValue} />

          {submitted ? (
            <div className="rounded-2xl bg-[#eafaf0] px-4 py-3 text-[14px] font-medium text-mindora-success shadow-[inset_3px_3px_7px_#c9ecd8,inset_-3px_-3px_7px_#ffffff]">
              {editingEntry === null
                ? "Mood logged - thank you for checking in today."
                : "Check-in updated."}
            </div>
          ) : null}

          {submitBlocked && !dailyLimitReached ? (
            <div className="rounded-2xl bg-mindora-purple-pale px-4 py-3 text-[14px] font-medium text-mindora-purple-dark shadow-[inset_3px_3px_7px_#d3caeb,inset_-3px_-3px_7px_#fdfbff]">
              You&apos;ve checked in 10 times today - that&apos;s today&apos;s limit. Come back
              tomorrow for your next one.
            </div>
          ) : null}

          {dailyLimitReached ? (
            <div className="rounded-2xl bg-mindora-purple-pale px-4 py-3 text-[14px] font-medium text-mindora-purple-dark shadow-[inset_3px_3px_7px_#d3caeb,inset_-3px_-3px_7px_#fdfbff]">
              You&apos;ve checked in 10 times today - that&apos;s today&apos;s limit. Come back
              tomorrow for your next one.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-medium text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-4">
            {editingEntry && (
              <button
                type="button"
                onClick={cancelEdit}
                className="h-13 flex-1 rounded-full text-[15px] font-semibold text-mindora-purple-dark shadow-[6px_6px_14px_#cdc6e0,-6px_-6px_14px_#fdfbff]"
              >
                Cancel edit
              </button>
            )}
            <button
              type="submit"
              disabled={activeMutation.isPending || submitBlocked || moodMissing}
              className="flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-mindora-purple px-7 text-[15px] font-bold text-white shadow-[8px_8px_18px_#c6bade,-8px_-8px_18px_#fdfbff] hover:bg-mindora-purple-dark disabled:cursor-not-allowed disabled:bg-mindora-lavender disabled:text-white/70 disabled:shadow-none"
            >
              {activeMutation.isPending
                ? editingEntry
                  ? "Saving…"
                  : "Logging…"
                : submitBlocked
                  ? "Limit reached for today"
                  : moodMissing
                    ? "Pick a mood to save"
                    : editingEntry
                      ? "Save changes"
                      : answeredCount === 3
                        ? "Save today's check-in"
                        : "Save what I have"}
            </button>
            <span className="text-[13px] font-semibold text-[#736c88]">
              {answeredCount} of 3 answered
            </span>
          </div>
        </form>

        <TodaysCheckIns editingId={editingEntry?.id ?? null} onEdit={startEdit} />
      </div>

      <BackfillDialog open={backfillOpen} onOpenChange={setBackfillOpen} />
    </div>
  );
}
