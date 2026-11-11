"use client";

export interface ScaleOption {
  emoji: string;
  caption: string;
}

// Index maps 1:1 to a tone - option 0 is always the "hardest" end of the
// scale (Low/Angry/Heavy), option 4 always the "best" end, regardless of
// which scale (mood/emotion/feeling) is rendering it.
const TONES = [
  { base: "#c0503f", soft: "#f0cec6", text: "#8f3729" }, // red
  { base: "#d9762a", soft: "#f3ddc6", text: "#9c5218" }, // orange
  { base: "#d99a1f", soft: "#f2e5c2", text: "#96690f" }, // yellow
  { base: "#8a9a4f", soft: "#e0e6cd", text: "#5f6d33" }, // lime
  { base: "#5f8a4f", soft: "#d5e4cf", text: "#3f6233" }, // green
] as const;

interface MoodScalePickerProps {
  label: string;
  options: readonly ScaleOption[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function MoodScalePicker({ label, options, selectedIndex, onSelect }: MoodScalePickerProps) {
  const answer = selectedIndex === null ? null : options[selectedIndex];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[16px] font-bold tracking-tight">{label}</span>
        <span
          className="text-[13px] font-bold"
          style={{ color: answer ? TONES[selectedIndex!].text : "#57506e" }}
        >
          {answer ? answer.caption : "Not set"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {options.map((opt, i) => {
          const tone = TONES[i];
          const on = selectedIndex === i;
          return (
            <button
              key={opt.caption}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(i)}
              className="flex min-h-[118px] flex-col items-center justify-center gap-2.5 rounded-[22px] px-2 py-5"
              style={{
                background: on ? tone.soft : "#eae6f4",
                boxShadow: on
                  ? `inset 5px 5px 11px ${tone.base}55, inset -5px -5px 11px #ffffffcc`
                  : "6px 6px 13px #cdc6e0, -6px -6px 13px #fdfbff",
              }}
            >
              <span
                className="text-[34px] leading-none"
                style={{
                  filter: selectedIndex === null || on ? "none" : "saturate(.45) opacity(.6)",
                }}
              >
                {opt.emoji}
              </span>
              <span
                className="text-center text-[12.5px] font-bold tracking-[0.1px]"
                style={{ color: on ? tone.text : "#57506e" }}
              >
                {opt.caption}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
