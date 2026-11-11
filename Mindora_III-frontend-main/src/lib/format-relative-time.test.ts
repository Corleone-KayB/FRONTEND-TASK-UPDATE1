import { formatRelativeTime } from "@/lib/format-relative-time";

describe("formatRelativeTime", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns 'just now' for a timestamp less than 30 seconds old", () => {
    // diffMin is rounded, so anything under 30s rounds to 0 minutes.
    expect(formatRelativeTime(new Date(now.getTime() - 10_000).toISOString())).toBe("just now");
  });

  it("returns minutes for a timestamp under an hour old", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 60_000).toISOString())).toBe("5m ago");
  });

  it("returns hours for a timestamp under a day old", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 60 * 60_000).toISOString())).toBe(
      "3h ago"
    );
  });

  it("returns days for a timestamp under a week old", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 2 * 24 * 60 * 60_000).toISOString())).toBe(
      "2d ago"
    );
  });

  it("falls back to a locale date string for anything a week or older", () => {
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60_000);
    expect(formatRelativeTime(eightDaysAgo.toISOString())).toBe(eightDaysAgo.toLocaleDateString());
  });
});
