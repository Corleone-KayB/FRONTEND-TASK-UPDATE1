import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  createTherapistTimeOff,
  deleteTherapistTimeOff,
  fetchAvailability,
  fetchMyAppointments,
  fetchTherapistAvailability,
  fetchTherapistDashboard,
  fetchTherapistPatients,
  fetchTherapistSchedule,
  fetchTherapistTimeOff,
  rateAppointment,
  submitBooking,
  updateTherapistAvailability,
} from "@/lib/appointments-api";
import type { BookingBody } from "@/lib/appointments-api";
import { ApiError } from "@/lib/api";
import type { AppointmentStatus, WorkingHoursWindow } from "@/types/domain";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useMyAppointments(status?: AppointmentStatus) {
  return useQuery({
    queryKey: ["appointments", "mine", status],
    queryFn: () => fetchMyAppointments({ status, limit: 50 }),
  });
}

export function useAvailability(therapistId: string | null) {
  return useQuery({
    queryKey: ["availability", therapistId],
    queryFn: () => fetchAvailability(therapistId as string),
    enabled: !!therapistId,
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    // Resolves with a BookingOutcome (success | conflict | error) instead of throwing,
    // so BookingDialog can show a distinct state for each. No toast here - the dialog
    // renders its own success screen and inline errors.
    mutationFn: (body: BookingBody) => submitBooking(body),
    onSuccess: (outcome, variables) => {
      if (outcome.kind === "error") return;
      // On a conflict the cached slots are stale, so refetch them as well.
      queryClient.invalidateQueries({ queryKey: ["availability", variables.therapistId] });
      if (outcome.kind === "success") {
        queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
      }
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
      toast.success("Appointment cancelled.");
    },
  });
}

export function useRateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) => rateAppointment(id, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
      toast.success("Rating submitted.");
    },
  });
}

export function useTherapistSchedule(date?: string) {
  return useQuery({
    queryKey: ["appointments", "schedule", date],
    // Pre-existing bug, found live: this requested limit: 100, but
    // appointment-service's therapistScheduleQuerySchema caps limit at 50
    // and 400s above that - every therapist landing on /therapist (the
    // default post-login page) was hitting this on every load.
    queryFn: () => fetchTherapistSchedule({ date, limit: 50 }),
  });
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "schedule"] });
      toast.success("Appointment confirmed.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not confirm this appointment.")),
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "schedule"] });
      toast.success("Appointment marked complete.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not complete this appointment.")),
  });
}

export function useTherapistDashboard() {
  return useQuery({
    queryKey: ["appointments", "dashboard"],
    queryFn: () => fetchTherapistDashboard(),
  });
}

// Query key family for the therapist's own availability (working hours +
// time off) is ["appointments", "availability", ...] - distinct from the
// patient-facing ["availability", therapistId] key useAvailability uses
// above, so invalidating one never touches the other.
export function useTherapistAvailability() {
  return useQuery({
    queryKey: ["appointments", "availability", "mine"],
    queryFn: () => fetchTherapistAvailability(),
  });
}

export function useUpdateTherapistAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { timezone: string; workingHours: WorkingHoursWindow[] }) =>
      updateTherapistAvailability(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "availability"] });
      toast.success("Working hours updated.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update your working hours.")),
  });
}

export function useTherapistTimeOff() {
  return useQuery({
    queryKey: ["appointments", "time-off"],
    queryFn: () => fetchTherapistTimeOff(),
  });
}

export function useCreateTherapistTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { startsAt: string; endsAt: string; reason?: string }) =>
      createTherapistTimeOff(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "time-off"] });
      toast.success("Time off added.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not add time off.")),
  });
}

export function useDeleteTherapistTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTherapistTimeOff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "time-off"] });
      toast.success("Time off removed.");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not remove this time off.")),
  });
}

export function useTherapistPatients(page: number, limit = 20) {
  return useQuery({
    queryKey: ["appointments", "patients", page, limit],
    queryFn: () => fetchTherapistPatients({ page, limit }),
  });
}
