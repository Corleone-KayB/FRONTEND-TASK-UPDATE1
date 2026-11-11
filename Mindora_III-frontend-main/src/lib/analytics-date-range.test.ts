import { computeDateRangePreset, fillDailySeries } from "@/lib/analytics-date-range";

// Fixed "now" well within a day, in UTC, so day-boundary math is unambiguous
// regardless of the machine's local timezone.
const NOW = new Date("2026-09-25T15:42:00.000Z");

describe("computeDateRangePreset", () => {
  it("'today' starts at the current UTC day's midnight and ends at now", () => {
    const range = computeDateRangePreset("today", NOW);
    expect(range.from).toBe("2026-09-25T00:00:00.000Z");
    expect(range.to).toBe(NOW.toISOString());
  });

  it("'7d' starts exactly 7*24h before now, not a rounded calendar day", () => {
    const range = computeDateRangePreset("7d", NOW);
    expect(range.from).toBe("2026-09-18T15:42:00.000Z");
    expect(range.to).toBe(NOW.toISOString());
  });

  it("'30d' starts exactly 30*24h before now", () => {
    const range = computeDateRangePreset("30d", NOW);
    expect(range.from).toBe("2026-08-26T15:42:00.000Z");
    expect(range.to).toBe(NOW.toISOString());
  });

  it("'90d' starts exactly 90*24h before now", () => {
    const range = computeDateRangePreset("90d", NOW);
    expect(range.from).toBe("2026-06-27T15:42:00.000Z");
    expect(range.to).toBe(NOW.toISOString());
  });

  it("'year' starts at January 1st UTC of the current year", () => {
    const range = computeDateRangePreset("year", NOW);
    expect(range.from).toBe("2026-01-01T00:00:00.000Z");
    expect(range.to).toBe(NOW.toISOString());
  });
});

describe("fillDailySeries", () => {
  it("fills days missing from a sparse trend array with the zero value", () => {
    const filled = fillDailySeries(
      [{ date: "2026-09-01", count: 5 }],
      "2026-08-30T00:00:00.000Z",
      "2026-09-02T00:00:00.000Z",
      { count: 0 }
    );
    expect(filled).toEqual([
      { date: "2026-08-30", count: 0 },
      { date: "2026-08-31", count: 0 },
      { date: "2026-09-01", count: 5 },
      { date: "2026-09-02", count: 0 },
    ]);
  });

  it("falls back to the sparse, sorted series when the range exceeds 366 days", () => {
    const points = [
      { date: "2026-05-01", count: 2 },
      { date: "2026-01-01", count: 1 },
    ];
    const filled = fillDailySeries(points, "2020-01-01T00:00:00.000Z", "2026-09-25T00:00:00.000Z", {
      count: 0,
    });
    expect(filled).toEqual([
      { date: "2026-01-01", count: 1 },
      { date: "2026-05-01", count: 2 },
    ]);
  });
});
