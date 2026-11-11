import {
  buildWorkingHoursPayload,
  findInvalidDay,
  groupWorkingHoursByDay,
  isValidDayWindow,
  validateTimeOffRange,
  type DayScheduleState,
} from "@/lib/availability";
import type { WorkingHoursWindow } from "@/types/domain";

function day(overrides: Partial<DayScheduleState> = {}): DayScheduleState {
  return {
    dayOfWeek: 1,
    enabled: false,
    startMinute: 540,
    endMinute: 1020,
    extraWindows: [],
    ...overrides,
  };
}

describe("groupWorkingHoursByDay", () => {
  it("produces exactly 7 rows, disabled with a 9-5 default when a day has no windows", () => {
    const rows = groupWorkingHoursByDay([]);
    expect(rows).toHaveLength(7);
    rows.forEach((row, i) => {
      expect(row.dayOfWeek).toBe(i);
      expect(row.enabled).toBe(false);
      expect(row.startMinute).toBe(540);
      expect(row.endMinute).toBe(1020);
      expect(row.extraWindows).toEqual([]);
    });
  });

  it("marks a day enabled and uses its window when one is present", () => {
    const rows = groupWorkingHoursByDay([{ dayOfWeek: 1, startMinute: 480, endMinute: 900 }]);
    expect(rows[1]).toMatchObject({ enabled: true, startMinute: 480, endMinute: 900 });
    expect(rows[1].extraWindows).toEqual([]);
  });

  // The "don't lose data" requirement: a day with a second window (e.g. a
  // lunch-break split) must not have that second window silently vanish
  // just because this V1 grid only edits one window per day.
  it("keeps the earliest window as editable and stashes the rest in extraWindows", () => {
    const windows: WorkingHoursWindow[] = [
      { dayOfWeek: 2, startMinute: 780, endMinute: 1020 },
      { dayOfWeek: 2, startMinute: 480, endMinute: 720 },
    ];
    const rows = groupWorkingHoursByDay(windows);
    expect(rows[2].startMinute).toBe(480);
    expect(rows[2].endMinute).toBe(720);
    expect(rows[2].extraWindows).toEqual([{ dayOfWeek: 2, startMinute: 780, endMinute: 1020 }]);
  });
});

describe("buildWorkingHoursPayload", () => {
  it("returns an empty list when every day is disabled", () => {
    const rows = groupWorkingHoursByDay([]);
    expect(buildWorkingHoursPayload(rows)).toEqual([]);
  });

  it("produces one window for a single enabled day", () => {
    const rows = groupWorkingHoursByDay([]);
    rows[1] = day({ dayOfWeek: 1, enabled: true, startMinute: 540, endMinute: 1020 });
    expect(buildWorkingHoursPayload(rows)).toEqual([
      { dayOfWeek: 1, startMinute: 540, endMinute: 1020 },
    ]);
  });

  it("produces one window per enabled day, in day order, omitting disabled days", () => {
    const rows = groupWorkingHoursByDay([]).map((row) => ({ ...row }));
    rows[1] = day({ dayOfWeek: 1, enabled: true, startMinute: 540, endMinute: 1020 });
    rows[3] = day({ dayOfWeek: 3, enabled: true, startMinute: 480, endMinute: 900 });
    rows[5] = day({ dayOfWeek: 5, enabled: true, startMinute: 600, endMinute: 840 });

    expect(buildWorkingHoursPayload(rows)).toEqual([
      { dayOfWeek: 1, startMinute: 540, endMinute: 1020 },
      { dayOfWeek: 3, startMinute: 480, endMinute: 900 },
      { dayOfWeek: 5, startMinute: 600, endMinute: 840 },
    ]);
  });

  it("re-attaches a disabled day's extraWindows if it was re-enabled without editing them", () => {
    const rows = groupWorkingHoursByDay([
      { dayOfWeek: 2, startMinute: 480, endMinute: 720 },
      { dayOfWeek: 2, startMinute: 780, endMinute: 1020 },
    ]);
    expect(buildWorkingHoursPayload(rows)).toEqual([
      { dayOfWeek: 2, startMinute: 480, endMinute: 720 },
      { dayOfWeek: 2, startMinute: 780, endMinute: 1020 },
    ]);
  });

  it("drops a disabled day's window entirely, including any extraWindows", () => {
    const rows = groupWorkingHoursByDay([
      { dayOfWeek: 2, startMinute: 480, endMinute: 720 },
      { dayOfWeek: 2, startMinute: 780, endMinute: 1020 },
    ]);
    rows[2].enabled = false;
    expect(buildWorkingHoursPayload(rows)).toEqual([]);
  });
});

describe("isValidDayWindow / findInvalidDay", () => {
  it("treats a disabled day as valid regardless of its stored times", () => {
    expect(isValidDayWindow(day({ enabled: false, startMinute: 1000, endMinute: 100 }))).toBe(true);
  });

  it("rejects an end time that is not after the start time", () => {
    expect(isValidDayWindow(day({ enabled: true, startMinute: 600, endMinute: 600 }))).toBe(false);
    expect(isValidDayWindow(day({ enabled: true, startMinute: 600, endMinute: 300 }))).toBe(false);
  });

  it("accepts a valid enabled window", () => {
    expect(isValidDayWindow(day({ enabled: true, startMinute: 540, endMinute: 1020 }))).toBe(true);
  });

  it("findInvalidDay returns null when every enabled day is valid", () => {
    const days = [
      day({ dayOfWeek: 1, enabled: true, startMinute: 540, endMinute: 1020 }),
      day({ dayOfWeek: 2, enabled: false, startMinute: 900, endMinute: 300 }),
    ];
    expect(findInvalidDay(days)).toBeNull();
  });

  it("findInvalidDay surfaces the first enabled day with a bad window", () => {
    const days = [
      day({ dayOfWeek: 1, enabled: true, startMinute: 540, endMinute: 1020 }),
      day({ dayOfWeek: 2, enabled: true, startMinute: 900, endMinute: 300 }),
    ];
    expect(findInvalidDay(days)?.dayOfWeek).toBe(2);
  });
});

describe("validateTimeOffRange", () => {
  it("requires both a start and end date", () => {
    expect(validateTimeOffRange("", "2026-07-03T00:00:00.000Z")).toMatch(/pick a start/i);
    expect(validateTimeOffRange("2026-07-01T00:00:00.000Z", "")).toMatch(/pick a start/i);
  });

  it("rejects an end date on or before the start date", () => {
    expect(validateTimeOffRange("2026-07-03T00:00:00.000Z", "2026-07-03T00:00:00.000Z")).toMatch(
      /after the start/i
    );
    expect(validateTimeOffRange("2026-07-03T00:00:00.000Z", "2026-07-01T00:00:00.000Z")).toMatch(
      /after the start/i
    );
  });

  it("accepts an end date after the start date", () => {
    expect(validateTimeOffRange("2026-07-01T00:00:00.000Z", "2026-07-03T00:00:00.000Z")).toBeNull();
  });
});
