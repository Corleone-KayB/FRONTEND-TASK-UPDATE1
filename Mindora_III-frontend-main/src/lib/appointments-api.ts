import { ApiError, apiFetch } from "@/lib/api";
import { toQueryString } from "@/lib/query-string";
import type {
  AppointmentStatus,
  AvailabilitySlot,
  BookedAppointment,
  SessionType,
  TherapistAvailability,
  TherapistDashboard,
  TherapistPatientSummary,
  TherapistProfile,
  TherapistTimeOff,
  WorkingHoursWindow,
} from "@/types/domain";

interface TherapistListResponse {
  therapists: TherapistProfile[];
  total: number;
  page: number;
  limit: number;
}

interface AppointmentListResponse {
  appointments: BookedAppointment[];
  total: number;
  page: number;
  limit: number;
}

interface AvailabilityResponse {
  therapistId: string;
  slots: AvailabilitySlot[];
}

interface TherapistTimeOffListResponse {
  timeOff: TherapistTimeOff[];
}

// PUT /availability only echoes {timezone, workingHours} back - no timeOff,
// unlike the full GET /availability response (TherapistAvailability).
interface UpdateTherapistAvailabilityResponse {
  timezone: string;
  workingHours: WorkingHoursWindow[];
}

interface TherapistPatientListResponse {
  patients: TherapistPatientSummary[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/v1/users/therapists - User Service. Only returns isAcceptingPatients: true.
export function fetchTherapists(params: {
  page?: number;
  limit?: number;
  specialisation?: string;
  language?: string;
}): Promise<TherapistListResponse> {
  return apiFetch(`/api/v1/users/therapists${toQueryString(params)}`);
}

// GET /api/v1/appointments/availability/:therapistId - Appointment Service.
// therapistId here is TherapistProfile.userId, not TherapistProfile.id.
export function fetchAvailability(
  therapistId: string,
  params: { from?: string; to?: string } = {}
): Promise<AvailabilityResponse> {
  return apiFetch(`/api/v1/appointments/availability/${therapistId}${toQueryString(params)}`);
}

// GET /api/v1/appointments/mine - Appointment Service, authenticated patient's own appointments.
export function fetchMyAppointments(params: {
  page?: number;
  limit?: number;
  status?: AppointmentStatus;
}): Promise<AppointmentListResponse> {
  return apiFetch(`/api/v1/appointments/mine${toQueryString(params)}`);
}

// POST /api/v1/appointments - creates a PENDING appointment. 409 if the slot was just taken.
export function bookAppointment(body: {
  therapistId: string;
  slotStart: string;
  slotEnd: string;
  sessionType: SessionType;
}): Promise<BookedAppointment> {
  return apiFetch("/api/v1/appointments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type BookingBody = Parameters<typeof bookAppointment>[0];

// What the UI sees after trying to book: exactly three outcomes, never a throw.
// - conflict: HTTP 409, slot taken. `message` is only set when the body matches the
//   agreed format (docs/BOOKING_CONTRACT.md); otherwise the UI uses its own text.
// - error: anything else. `network` is true when no HTTP response arrived at all.
export type BookingOutcome =
  | { kind: "success"; appointment: BookedAppointment }
  | { kind: "conflict"; message?: string }
  | { kind: "error"; network: boolean; message?: string };

// Agreed 409 body: { error: "SLOT_TAKEN", message: "<friendly text>" }. Only string
// fields are read; anything else is ignored and the caller falls back to its own copy.
function conflictMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const { error, message } = body as Record<string, unknown>;
  if (error !== "SLOT_TAKEN" || typeof message !== "string" || !message.trim()) return undefined;
  return message;
}

// Wraps bookAppointment so components never inspect HTTP status codes themselves.
export async function submitBooking(body: BookingBody): Promise<BookingOutcome> {
  try {
    return { kind: "success", appointment: await bookAppointment(body) };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) return { kind: "conflict", message: conflictMessage(err.body) };
      if (err.status === 0) return { kind: "error", network: true };
      // Server wording is only trusted for 4xx (e.g. a business-rule refusal); 5xx text is noise.
      return { kind: "error", network: false, message: err.status < 500 ? err.message : undefined };
    }
    return { kind: "error", network: false };
  }
}

// PUT /api/v1/appointments/:id/cancel
export function cancelAppointment(
  id: string,
  cancellationReason: string
): Promise<BookedAppointment> {
  return apiFetch(`/api/v1/appointments/${id}/cancel`, {
    method: "PUT",
    body: JSON.stringify({ cancellationReason }),
  });
}

// POST /api/v1/appointments/:id/rate - 422 if the appointment isn't COMPLETED yet.
export function rateAppointment(id: string, rating: number): Promise<BookedAppointment> {
  return apiFetch(`/api/v1/appointments/${id}/rate`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
}

// GET /api/v1/appointments/schedule - therapist only. Appointments for the authenticated
// therapist, ordered by slotStart.
export function fetchTherapistSchedule(params: {
  date?: string;
  page?: number;
  limit?: number;
}): Promise<AppointmentListResponse> {
  return apiFetch(`/api/v1/appointments/schedule${toQueryString(params)}`);
}

// PUT /api/v1/appointments/:id/confirm - therapist only. PENDING -> CONFIRMED.
export function confirmAppointment(id: string): Promise<BookedAppointment> {
  return apiFetch(`/api/v1/appointments/${id}/confirm`, { method: "PUT" });
}

// PUT /api/v1/appointments/:id/complete - therapist only.
export function completeAppointment(id: string): Promise<BookedAppointment> {
  return apiFetch(`/api/v1/appointments/${id}/complete`, { method: "PUT" });
}

// GET /api/v1/appointments/dashboard - therapist only. Overview stats plus
// today's CONFIRMED sessions.
export function fetchTherapistDashboard(): Promise<TherapistDashboard> {
  return apiFetch("/api/v1/appointments/dashboard");
}

// GET /api/v1/appointments/availability - therapist only, the caller's own
// working hours + time off. Distinct from fetchAvailability above (that one
// computes bookable slots for a given therapist, patient-facing).
export function fetchTherapistAvailability(): Promise<TherapistAvailability> {
  return apiFetch("/api/v1/appointments/availability");
}

// PUT /api/v1/appointments/availability - therapist only. Full replace:
// always send the complete workingHours list, never a diff. Max 50 entries;
// each dayOfWeek 0-6, endMinute > startMinute (zod 400 with fieldErrors on
// violation).
export function updateTherapistAvailability(body: {
  timezone: string;
  workingHours: WorkingHoursWindow[];
}): Promise<UpdateTherapistAvailabilityResponse> {
  return apiFetch("/api/v1/appointments/availability", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// GET /api/v1/appointments/time-off - therapist only. Only future/ongoing blocks.
export function fetchTherapistTimeOff(): Promise<TherapistTimeOffListResponse> {
  return apiFetch("/api/v1/appointments/time-off");
}

// POST /api/v1/appointments/time-off - therapist only. endsAt must be after
// startsAt (ISO datetimes).
export function createTherapistTimeOff(body: {
  startsAt: string;
  endsAt: string;
  reason?: string;
}): Promise<TherapistTimeOff> {
  return apiFetch("/api/v1/appointments/time-off", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// DELETE /api/v1/appointments/time-off/:id - therapist only. 404 if it
// doesn't belong to the caller.
export function deleteTherapistTimeOff(id: string): Promise<null> {
  return apiFetch(`/api/v1/appointments/time-off/${id}`, { method: "DELETE" });
}

// GET /api/v1/appointments/patients - therapist only. Only ever contains
// patients with an actual appointment relationship to the caller
// (backend-enforced).
export function fetchTherapistPatients(params: {
  page?: number;
  limit?: number;
}): Promise<TherapistPatientListResponse> {
  return apiFetch(`/api/v1/appointments/patients${toQueryString(params)}`);
}
