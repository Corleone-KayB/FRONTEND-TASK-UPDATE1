import { selectNextSession, filterAppointmentsByTab } from "@/lib/appointments";
import type { BookedAppointment } from "@/types/domain";

const NOW = new Date("2026-08-24T12:00:00.000Z").getTime();

function appointment(overrides: Partial<BookedAppointment> = {}): BookedAppointment {
  return {
    id: "apt-1",
    patientId: "patient-1",
    therapistId: "therapist-1",
    slotStart: "2026-08-25T12:00:00.000Z",
    slotEnd: "2026-08-25T13:00:00.000Z",
    sessionType: "AUDIO",
    status: "CONFIRMED",
    cancellationReason: null,
    rating: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("selectNextSession", () => {
  it("returns null when there are no appointments", () => {
    expect(selectNextSession([], NOW)).toBeNull();
  });

  it("picks the earliest future PENDING or CONFIRMED appointment", () => {
    const soon = appointment({ id: "soon", slotStart: "2026-08-25T09:00:00.000Z" });
    const later = appointment({ id: "later", slotStart: "2026-08-27T09:00:00.000Z" });
    expect(selectNextSession([later, soon], NOW)?.id).toBe("soon");
  });

  // The regression this was written for: an appointment whose slot has
  // already passed but was never marked COMPLETED/CANCELLED must not win
  // the "earliest" sort just because it's chronologically first.
  it("excludes an active appointment whose slot has already passed", () => {
    const stale = appointment({
      id: "stale",
      status: "CONFIRMED",
      slotStart: "2026-08-20T12:00:00.000Z",
    });
    const upcoming = appointment({ id: "upcoming", slotStart: "2026-08-26T12:00:00.000Z" });
    expect(selectNextSession([stale, upcoming], NOW)?.id).toBe("upcoming");
  });

  it("excludes COMPLETED and CANCELLED appointments even if their slot is in the future", () => {
    const completed = appointment({ status: "COMPLETED", slotStart: "2026-08-26T12:00:00.000Z" });
    const cancelled = appointment({ status: "CANCELLED", slotStart: "2026-08-27T12:00:00.000Z" });
    expect(selectNextSession([completed, cancelled], NOW)).toBeNull();
  });

  it("returns null when every active appointment is in the past", () => {
    const stale = appointment({ status: "PENDING", slotStart: "2026-08-01T12:00:00.000Z" });
    expect(selectNextSession([stale], NOW)).toBeNull();
  });
});

describe("filterAppointmentsByTab", () => {
  const future = appointment({
    id: "future",
    status: "CONFIRMED",
    slotStart: "2026-08-26T12:00:00.000Z",
  });
  const stalePending = appointment({
    id: "stale-pending",
    status: "PENDING",
    slotStart: "2026-08-20T12:00:00.000Z",
  });
  const completed = appointment({
    id: "completed",
    status: "COMPLETED",
    slotStart: "2026-08-01T12:00:00.000Z",
  });
  const cancelled = appointment({
    id: "cancelled",
    status: "CANCELLED",
    slotStart: "2026-08-26T12:00:00.000Z",
  });
  const all = [future, stalePending, completed, cancelled];

  it("'upcoming' only includes active appointments whose slot hasn't passed", () => {
    const ids = filterAppointmentsByTab(all, "upcoming", NOW).map((a) => a.id);
    expect(ids).toEqual(["future"]);
  });

  it("'past' includes COMPLETED appointments and active appointments whose slot has passed", () => {
    const ids = filterAppointmentsByTab(all, "past", NOW).map((a) => a.id);
    expect(ids.sort()).toEqual(["completed", "stale-pending"]);
  });

  it("'cancelled' only includes CANCELLED appointments", () => {
    const ids = filterAppointmentsByTab(all, "cancelled", NOW).map((a) => a.id);
    expect(ids).toEqual(["cancelled"]);
  });

  it("never drops a stale active appointment - it always lands in exactly one tab", () => {
    const upcoming = filterAppointmentsByTab(all, "upcoming", NOW);
    const past = filterAppointmentsByTab(all, "past", NOW);
    const cancelledTab = filterAppointmentsByTab(all, "cancelled", NOW);
    expect(upcoming.length + past.length + cancelledTab.length).toBe(all.length);
  });
});
