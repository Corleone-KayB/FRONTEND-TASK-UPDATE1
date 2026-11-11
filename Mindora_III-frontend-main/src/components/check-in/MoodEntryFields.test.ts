import {
  scaleIndexToScore,
  scoreToScaleIndex,
  emotionIndexToArray,
  emotionsArrayToIndex,
  EMOTION_OPTIONS,
} from "@/components/check-in/MoodEntryFields";

describe("scaleIndexToScore", () => {
  it("maps each of the 5 scale positions to its backend score", () => {
    expect(scaleIndexToScore(0)).toBe(1);
    expect(scaleIndexToScore(1)).toBe(3);
    expect(scaleIndexToScore(2)).toBe(6);
    expect(scaleIndexToScore(3)).toBe(8);
    expect(scaleIndexToScore(4)).toBe(10);
  });

  it("returns undefined for a null index (nothing picked)", () => {
    expect(scaleIndexToScore(null)).toBeUndefined();
  });
});

describe("scoreToScaleIndex", () => {
  it("round-trips every scale position through its own score", () => {
    for (let i = 0; i < 5; i++) {
      expect(scoreToScaleIndex(scaleIndexToScore(i))).toBe(i);
    }
  });

  it("snaps a score that isn't an exact scale value to the closest position", () => {
    expect(scoreToScaleIndex(2)).toBe(0); // closer to 1 than to 3
    expect(scoreToScaleIndex(4)).toBe(1); // closer to 3 than to 6
  });

  it("on a tie between two positions, keeps the first (lower) one found", () => {
    expect(scoreToScaleIndex(7)).toBe(2); // equidistant from 6 (idx 2) and 8 (idx 3)
    expect(scoreToScaleIndex(9)).toBe(3); // equidistant from 8 (idx 3) and 10 (idx 4)
  });

  it("returns null for a missing score rather than guessing a position", () => {
    expect(scoreToScaleIndex(null)).toBeNull();
    expect(scoreToScaleIndex(undefined)).toBeNull();
  });
});

describe("emotionIndexToArray / emotionsArrayToIndex", () => {
  it("round-trips a selected emotion through the single-element array shape", () => {
    for (let i = 0; i < EMOTION_OPTIONS.length; i++) {
      const arr = emotionIndexToArray(i);
      expect(arr).toEqual([EMOTION_OPTIONS[i].caption]);
      expect(emotionsArrayToIndex(arr!)).toBe(i);
    }
  });

  it("emotionIndexToArray returns undefined when nothing is selected", () => {
    expect(emotionIndexToArray(null)).toBeUndefined();
  });

  it("emotionsArrayToIndex returns null for an empty array", () => {
    expect(emotionsArrayToIndex([])).toBeNull();
  });

  it("emotionsArrayToIndex returns null for a caption outside the current 5 options", () => {
    // e.g. an entry logged under the old multi-select tag UI, or edited via the API directly.
    expect(emotionsArrayToIndex(["Nostalgic"])).toBeNull();
  });
});
