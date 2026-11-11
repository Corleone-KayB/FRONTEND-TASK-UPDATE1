"use client";

import { MoodScalePicker, type ScaleOption } from "@/components/check-in/MoodScalePicker";

const JOURNAL_MAX_LENGTH = 5000;

export const MOOD_OPTIONS: readonly ScaleOption[] = [
  { emoji: "😢", caption: "Low" },
  { emoji: "😔", caption: "Down" },
  { emoji: "😐", caption: "Okay" },
  { emoji: "🙂", caption: "Good" },
  { emoji: "😄", caption: "Great" },
];

export const EMOTION_OPTIONS: readonly ScaleOption[] = [
  { emoji: "😠", caption: "Angry" },
  { emoji: "😰", caption: "Anxious" },
  { emoji: "😶", caption: "Numb" },
  { emoji: "😌", caption: "Content" },
  { emoji: "😍", caption: "Joyful" },
];

export const FEELING_OPTIONS: readonly ScaleOption[] = [
  { emoji: "😫", caption: "Heavy" },
  { emoji: "😕", caption: "Worn" },
  { emoji: "😐", caption: "Neutral" },
  { emoji: "😇", caption: "Light" },
  { emoji: "🌞", caption: "Alive" },
];

// The backend has no dedicated fields for these 5-point categorical picks -
// Mood/Emotion/Feeling replace what used to be four separate slider fields
// (moodScore, stressLevel, sleepHours, energyLevel) plus a multi-select
// emotion tag list. Rather than a schema change, this rescales onto the
// existing LogMoodRequest/UpdateMoodRequest fields:
//   Mood scale index    -> moodScore (rescaled 0-4 to 1-10, lossy by design)
//   Feeling scale index -> energyLevel (repurposed - sleep/stress/energy
//                          sliders are gone from this UI entirely, so the
//                          field is free; "heavy/light/alive" is a stand-in
//                          for what energyLevel used to measure directly)
//   Emotion scale pick  -> emotions[0] (single-element array - the new 5
//                          captions are NOT the old curated tag vocabulary,
//                          so anything downstream reading `emotions` or
//                          historical `avgEnergy` trends should know the
//                          meaning shifted here, even though no API/schema
//                          change was needed to ship this)
// No backend change required to store this; flagged for whoever owns
// mood analytics/reporting since the *meaning* of these fields changed.
const SCALE_TO_SCORE = [1, 3, 6, 8, 10] as const;

export function scaleIndexToScore(index: number | null): number | undefined {
  return index === null ? undefined : SCALE_TO_SCORE[index];
}

export function scoreToScaleIndex(score: number | null | undefined): number | null {
  if (score == null) return null;
  let closestIndex = 0;
  let closestDiff = Infinity;
  SCALE_TO_SCORE.forEach((s, i) => {
    const diff = Math.abs(s - score);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  });
  return closestIndex;
}

export function emotionIndexToArray(index: number | null): string[] | undefined {
  return index === null ? undefined : [EMOTION_OPTIONS[index].caption];
}

// Only recognizes the current 5 captions - an entry logged under the old
// multi-select tag UI (or edited by hitting the API directly) won't match
// any of them, and correctly comes back as "not set" rather than a guess.
export function emotionsArrayToIndex(emotions: string[]): number | null {
  if (emotions.length === 0) return null;
  const idx = EMOTION_OPTIONS.findIndex((o) => o.caption === emotions[0]);
  return idx === -1 ? null : idx;
}

export interface MoodFieldsValue {
  moodIndex: number | null;
  emotionIndex: number | null;
  feelingIndex: number | null;
  journalNote: string;
}

export const DEFAULT_MOOD_FIELDS: MoodFieldsValue = {
  moodIndex: null,
  emotionIndex: null,
  feelingIndex: null,
  journalNote: "",
};

interface MoodEntryFieldsProps {
  value: MoodFieldsValue;
  onChange: (value: MoodFieldsValue) => void;
}

// Shared scale-picker/journal block reused by the main check-in form (new
// entries), its edit mode, and the backfill dialog - keeps all three visually
// and behaviourally identical instead of drifting apart.
export function MoodEntryFields({ value, onChange }: MoodEntryFieldsProps) {
  function set<K extends keyof MoodFieldsValue>(key: K, next: MoodFieldsValue[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <>
      <MoodScalePicker
        label="Mood"
        options={MOOD_OPTIONS}
        selectedIndex={value.moodIndex}
        onSelect={(i) => set("moodIndex", i)}
      />
      <MoodScalePicker
        label="Emotion"
        options={EMOTION_OPTIONS}
        selectedIndex={value.emotionIndex}
        onSelect={(i) => set("emotionIndex", i)}
      />
      <MoodScalePicker
        label="Feeling"
        options={FEELING_OPTIONS}
        selectedIndex={value.feelingIndex}
        onSelect={(i) => set("feelingIndex", i)}
      />

      <div className="flex flex-col gap-3">
        <span className="text-[16px] font-bold tracking-tight">Your daily journal (optional)</span>
        <textarea
          rows={4}
          maxLength={JOURNAL_MAX_LENGTH}
          value={value.journalNote}
          onChange={(e) => set("journalNote", e.target.value)}
          placeholder="A sentence for future you."
          className="min-h-[96px] w-full resize-y rounded-[22px] px-[18px] py-4 text-[14px] leading-relaxed text-foreground shadow-[inset_5px_5px_12px_#cdc6e0,inset_-5px_-5px_12px_#fdfbff] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mindora-purple/30"
        />
        <p className="text-right text-[11px] text-muted-foreground">
          {value.journalNote.length}/{JOURNAL_MAX_LENGTH}
        </p>
      </div>
    </>
  );
}
