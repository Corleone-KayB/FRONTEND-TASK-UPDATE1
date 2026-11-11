// Curated tap-list for the check-in emotion picker. Not a backend-defined enum -
// POST /api/v1/mood/log accepts any free-form strings (max 20 items, 1-64 chars
// each) for `emotions`, this is purely a frontend UX convenience.
export const emotionOptions = [
  "Calm",
  "Anxious",
  "Hopeful",
  "Tired",
  "Sad",
  "Energized",
  "Overwhelmed",
  "Content",
] as const;

export type EmotionTag = (typeof emotionOptions)[number];
