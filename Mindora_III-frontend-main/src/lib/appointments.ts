import type { BookedAppointment } from "@/types/domain";

const ACTIVE_STATUSES = new Set<BookedAppointment["status"]>(["PENDING", "CONFIRMED"]);

function isActive(a: BookedAppointment): boolean {
  return ACTIVE_STATUSES.has(a.status);
}

function isFuture(a: BookedAppointment, now: number): boolean {
  return new Date(a.slotStart).getTime() > now;
}

// The earliest still-active appointment that hasn't happened yet - powers the
// Today page's "Next session" card. An active appointment whose slot has
// already passed (status never transitioned to COMPLETED/CANCELLED) must not
// win here, or a stale booking looks like it's still coming up.
export function selectNextSession(
  appointments: readonly BookedAppointment[],
  now: number
): BookedAppointment | null {
  return (
    [...appointments]
      .filter((a) => isActive(a) && isFuture(a, now))
      .sort((a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime())[0] ?? null
  );
}

export type AppointmentTab = "upcoming" | "past" | "cancelled";

// Same active-but-past-due gap as selectNextSession: an appointment whose
// time has passed but was never marked COMPLETED still needs a home, so it
// falls into "past" rather than vanishing or lingering in "upcoming".
export function filterAppointmentsByTab(
  appointments: readonly BookedAppointment[],
  tab: AppointmentTab,
  now: number
): BookedAppointment[] {
  return appointments.filter((a) => {
    if (tab === "upcoming") return isActive(a) && isFuture(a, now);
    if (tab === "past") return a.status === "COMPLETED" || (isActive(a) && !isFuture(a, now));
    return a.status === "CANCELLED";
  });
}
