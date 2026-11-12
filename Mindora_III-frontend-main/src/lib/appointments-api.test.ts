import { ApiError, apiFetch } from "@/lib/api";
import { submitBooking } from "@/lib/appointments-api";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.Mock;
const body = {
  therapistId: "t1",
  slotStart: "2030-01-15T09:00:00.000Z",
  slotEnd: "2030-01-15T09:50:00.000Z",
  sessionType: "VIDEO" as const,
};

describe("submitBooking", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns success with the appointment", async () => {
    mockedApiFetch.mockResolvedValueOnce({ id: "a1" });
    expect(await submitBooking(body)).toEqual({ kind: "success", appointment: { id: "a1" } });
  });

  it("uses the message from the agreed SLOT_TAKEN 409 body", async () => {
    const b = { error: "SLOT_TAKEN", message: "Taken!", availableSlots: [] };
    mockedApiFetch.mockRejectedValueOnce(new ApiError("Taken!", 409, undefined, b));
    expect(await submitBooking(body)).toEqual({ kind: "conflict", message: "Taken!" });
  });

  it.each([
    ["missing body", undefined],
    ["different body", { error: "OTHER", message: "x" }],
    ["non-string message", { error: "SLOT_TAKEN", message: 42 }],
    ["blank message", { error: "SLOT_TAKEN", message: "  " }],
  ])("falls back to status-only conflict for %s", async (_name, b) => {
    mockedApiFetch.mockRejectedValueOnce(new ApiError("x", 409, undefined, b));
    expect(await submitBooking(body)).toEqual({ kind: "conflict", message: undefined });
  });

  it("maps status 0 to a network error", async () => {
    mockedApiFetch.mockRejectedValueOnce(new ApiError("offline", 0));
    expect(await submitBooking(body)).toEqual({ kind: "error", network: true });
  });

  it("passes 4xx messages through but hides 5xx text", async () => {
    mockedApiFetch.mockRejectedValueOnce(new ApiError("Limit reached", 422));
    expect(await submitBooking(body)).toEqual({
      kind: "error",
      network: false,
      message: "Limit reached",
    });
    mockedApiFetch.mockRejectedValueOnce(new ApiError("API error: 500", 500));
    expect(await submitBooking(body)).toEqual({
      kind: "error",
      network: false,
      message: undefined,
    });
  });

  it("maps non-API exceptions to a generic error", async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error("boom"));
    expect(await submitBooking(body)).toEqual({ kind: "error", network: false });
  });
});
