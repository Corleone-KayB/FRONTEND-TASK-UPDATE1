import { relativeDayLabel } from "@/components/home/NextSessionCard";

// Pinned at noon local time (not midnight) to keep every case well clear of a
// day-boundary rollover regardless of the machine's timezone.
const SYSTEM_NOW = new Date(2026, 7, 24, 12, 0, 0);

function daysFromNow(offset: number): string {
  const d = new Date(
    SYSTEM_NOW.getFullYear(),
    SYSTEM_NOW.getMonth(),
    SYSTEM_NOW.getDate() + offset,
    9,
    0,
    0
  );
  return d.toISOString();
}

describe("relativeDayLabel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(SYSTEM_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("labels today's date as 'Today'", () => {
    expect(relativeDayLabel(daysFromNow(0))).toBe("Today");
  });

  it("labels tomorrow as 'Tomorrow'", () => {
    expect(relativeDayLabel(daysFromNow(1))).toBe("Tomorrow");
  });

  it("labels dates further out as 'In N days'", () => {
    expect(relativeDayLabel(daysFromNow(4))).toBe("In 4 days");
  });

  // The regression this was written for: a date that has already passed must
  // never read as "Today" - that's what let a stale appointment look current.
  it("labels yesterday as 'Yesterday', not 'Today'", () => {
    expect(relativeDayLabel(daysFromNow(-1))).toBe("Yesterday");
  });

  it("labels dates further in the past as 'N days ago'", () => {
    expect(relativeDayLabel(daysFromNow(-4))).toBe("4 days ago");
  });
});
