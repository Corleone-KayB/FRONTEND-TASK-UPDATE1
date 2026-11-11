"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { useMoodHistory } from "@/hooks/useMood";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function mondayOfThisWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun .. 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
}

function localDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in the browser's own timezone
}

// This week's day-by-day mood, derived client-side from raw history entries
// rather than a server date-range filter - same defensive pattern already used
// by TodaysCheckIns (fetch a generous recent page, filter by local calendar date).
export function WeeklyMoodCard() {
  const { data: history, isLoading, isError } = useMoodHistory({ limit: 50 });

  const days = useMemo(() => {
    const entries = history?.entries ?? [];
    const monday = mondayOfThisWeek();
    const todayKey = localDateKey(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const key = localDateKey(date);
      const dayEntries = entries.filter((e) => localDateKey(new Date(e.recordedAt)) === key);
      return {
        key,
        label: WEEKDAY_LABELS[i],
        isToday: key === todayKey,
        done: dayEntries.length > 0,
      };
    });
  }, [history]);

  if (isLoading) {
    return (
      <div className="h-[180px] animate-pulse rounded-[34px] bg-white/60 shadow-[12px_12px_26px_#cbc4de,-12px_-12px_26px_#fdfbff]" />
    );
  }

  // A failed fetch must never render as an empty week - that reads as "you
  // haven't checked in all week" when the truth is just "we couldn't check."
  if (isError) {
    return (
      <div className="flex flex-col gap-3 rounded-[34px] bg-white p-6 shadow-[12px_12px_26px_#cbc4de,-12px_-12px_26px_#fdfbff]">
        <h3 className="text-[16.5px] font-bold tracking-tight text-foreground">This week</h3>
        <p className="text-[13.5px] text-muted-foreground">
          Could not load this week&apos;s check-ins right now. Your history is safe - try
          refreshing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-5 rounded-[34px] bg-white p-6 shadow-[12px_12px_26px_#cbc4de,-12px_-12px_26px_#fdfbff]">
      <h3 className="text-[16.5px] font-bold tracking-tight text-foreground">This week</h3>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day.key} className="flex flex-col items-center gap-2">
            {day.done ? (
              <div className="grid aspect-square w-full place-items-center rounded-full bg-mindora-purple shadow-[3px_3px_8px_#c6bade,-3px_-3px_8px_#fdfbff]">
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.2} />
              </div>
            ) : day.isToday ? (
              <div className="aspect-square w-full rounded-full border-2 border-dashed border-[#bda9f0] shadow-[inset_3px_3px_7px_#cdc6e0,inset_-3px_-3px_7px_#fdfbff]" />
            ) : (
              <div className="aspect-square w-full rounded-full shadow-[inset_3px_3px_7px_#cdc6e0,inset_-3px_-3px_7px_#fdfbff]" />
            )}
            <span
              className={
                day.isToday
                  ? "text-[11px] font-bold text-mindora-purple-dark"
                  : "text-[11px] font-semibold text-[#8f87a4]"
              }
            >
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
