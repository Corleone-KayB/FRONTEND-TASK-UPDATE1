import type { WorkingHoursWindow } from "@/types/domain";

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const DEFAULT_START_MINUTE = 9 * 60; // 9:00 AM
const DEFAULT_END_MINUTE = 17 * 60; // 5:00 PM

// One row of the weekly grid the Availability page renders. `startMinute`/
// `endMinute` are the single editable window this V1 UI exposes per day;
// `extraWindows` carries any additional windows that day already had on the
// server (e.g. a lunch-break split) that this grid doesn't offer editing
// for, so a save never silently drops them.
export interface DayScheduleState {
  dayOfWeek: number;
  enabled: boolean;
  startMinute: number;
  endMinute: number;
  extraWindows: WorkingHoursWindow[];
}

export function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

// Groups the flat list GET /availability returns into one row per day
// (0-6). A day with no windows starts disabled with a 9-5 default so
// turning it on doesn't require picking times from scratch. A day with more
// than one window keeps its earliest window as the editable start/end pair
// and stashes the rest in extraWindows - see DayScheduleState above.
export function groupWorkingHoursByDay(workingHours: WorkingHoursWindow[]): DayScheduleState[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const windows = workingHours
      .filter((w) => w.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startMinute - b.startMinute);
    const [first, ...rest] = windows;
    return {
      dayOfWeek,
      enabled: windows.length > 0,
      startMinute: first?.startMinute ?? DEFAULT_START_MINUTE,
      endMinute: first?.endMinute ?? DEFAULT_END_MINUTE,
      extraWindows: rest,
    };
  });
}

// Inverse of groupWorkingHoursByDay - flattens the per-day grid rows back
// into the flat list PUT /availability expects (a full replace, so this
// must include every window that should survive the save, not just the
// ones the grid lets the therapist edit).
export function buildWorkingHoursPayload(days: DayScheduleState[]): WorkingHoursWindow[] {
  return days
    .filter((day) => day.enabled)
    .flatMap((day) => [
      { dayOfWeek: day.dayOfWeek, startMinute: day.startMinute, endMinute: day.endMinute },
      ...day.extraWindows,
    ]);
}

// Mirrors the backend's zod validation (startMinute/endMinute 0-1439,
// endMinute > startMinute) so the UI can catch the obvious mistakes before
// ever making the request - the backend's own 400/fieldErrors is still the
// authority and gets surfaced too if it disagrees.
export function isValidDayWindow(day: DayScheduleState): boolean {
  if (!day.enabled) return true;
  return (
    Number.isInteger(day.startMinute) &&
    Number.isInteger(day.endMinute) &&
    day.startMinute >= 0 &&
    day.startMinute <= 1439 &&
    day.endMinute >= 0 &&
    day.endMinute <= 1439 &&
    day.endMinute > day.startMinute
  );
}

export function findInvalidDay(days: DayScheduleState[]): DayScheduleState | null {
  return days.find((day) => day.enabled && !isValidDayWindow(day)) ?? null;
}

// Validates a prospective time-off block before POSTing it - endsAt must be
// strictly after startsAt, matching the backend's own check.
export function validateTimeOffRange(startsAt: string, endsAt: string): string | null {
  if (!startsAt || !endsAt) return "Pick a start and end date.";
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "Enter valid dates.";
  if (end <= start) return "End date must be after the start date.";
  return null;
}
