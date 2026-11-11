// Pure date-range math for the admin Analytics page - kept separate from the page
// component so the preset boundaries are unit-testable without rendering anything.

export type AnalyticsRangePreset = "today" | "7d" | "30d" | "90d" | "year" | "custom";

export interface AnalyticsDateRange {
  from: string;
  to: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Every non-custom preset resolves against UTC day boundaries rather than the
// browser's local timezone - the backend takes plain ISO instants, admins may be
// in any timezone, and "today" here means the current UTC day rather than
// "midnight wherever this browser happens to be." That keeps the math
// deterministic (and testable) without mocking Intl/TZ.
export function computeDateRangePreset(
  preset: Exclude<AnalyticsRangePreset, "custom">,
  now: Date
): AnalyticsDateRange {
  const to = now.toISOString();
  const startOfTodayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );

  switch (preset) {
    case "today":
      return { from: startOfTodayUtc.toISOString(), to };
    case "7d":
      return { from: new Date(now.getTime() - 7 * DAY_MS).toISOString(), to };
    case "30d":
      return { from: new Date(now.getTime() - 30 * DAY_MS).toISOString(), to };
    case "90d":
      return { from: new Date(now.getTime() - 90 * DAY_MS).toISOString(), to };
    case "year":
      return { from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0)).toISOString(), to };
    default: {
      // Exhaustiveness guard - every real preset is handled above.
      const _never: never = preset;
      throw new Error(`Unhandled preset: ${_never}`);
    }
  }
}

// registrationTrend/applicationTrend/sessionTrend from the /analytics/detailed
// endpoint are sparse - a day with zero events is simply missing from the array,
// not a zero-value entry. This fills the missing days in [from, to] with `zero`
// so a line/area chart doesn't draw a false diagonal across a gap. Capped at 366
// days: past that, a huge custom/year range over a low-volume dataset would
// otherwise materialize hundreds of invisible zero points, so the sparse series
// is returned as-is (sorted) instead.
export function fillDailySeries<T extends { date: string }>(
  points: readonly T[],
  from: string,
  to: string,
  zero: Omit<T, "date">
): T[] {
  const byDate = new Map(points.map((p) => [p.date, p]));
  const start = new Date(from);
  const end = new Date(to);

  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const spanDays = Math.round((endDay - startDay) / DAY_MS);

  if (!Number.isFinite(spanDays) || spanDays < 0 || spanDays > 366) {
    return [...points].sort((a, b) => a.date.localeCompare(b.date));
  }

  const out: T[] = [];
  for (let i = 0; i <= spanDays; i++) {
    const key = new Date(startDay + i * DAY_MS).toISOString().slice(0, 10);
    out.push(byDate.get(key) ?? ({ date: key, ...zero } as T));
  }
  return out;
}
