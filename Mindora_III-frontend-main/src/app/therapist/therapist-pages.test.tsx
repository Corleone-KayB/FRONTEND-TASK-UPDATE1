import { render, screen } from "@testing-library/react";
import TherapistSchedulePage from "@/app/therapist/page";
import TherapistDashboardPage from "@/app/therapist/dashboard/page";
import TherapistPatientsPage from "@/app/therapist/patients/page";
import {
  useCompleteAppointment,
  useConfirmAppointment,
  usePatientName,
  useTherapistDashboard,
  useTherapistPatients,
  useTherapistSchedule,
} from "@/hooks/useAppointments";

jest.mock("@/hooks/useAppointments", () => ({
  useCompleteAppointment: jest.fn(),
  useConfirmAppointment: jest.fn(),
  usePatientName: jest.fn(),
  useTherapistDashboard: jest.fn(),
  useTherapistPatients: jest.fn(),
  useTherapistSchedule: jest.fn(),
}));
jest.mock("@/components/therapist/MoodReportDialog", () => ({ MoodReportDialog: () => null }));

const schedule = useTherapistSchedule as jest.Mock;
const dashboard = useTherapistDashboard as jest.Mock;
const patients = useTherapistPatients as jest.Mock;

const idle = { data: undefined, isLoading: false, isError: false };
const apt = {
  id: "a1",
  patientId: "11111111-aaaa-bbbb-cccc-222222222222",
  therapistId: "t1",
  slotStart: "2030-01-15T09:00:00.000Z",
  slotEnd: "2030-01-15T09:50:00.000Z",
  sessionType: "VIDEO",
  status: "PENDING",
  cancellationReason: null,
  rating: null,
  createdAt: "2030-01-10T09:00:00.000Z",
  updatedAt: "2030-01-10T09:00:00.000Z",
};

beforeEach(() => {
  (useConfirmAppointment as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  (useCompleteAppointment as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  (usePatientName as jest.Mock).mockReturnValue((id: string) =>
    id === apt.patientId ? "Amina Uwase" : `Patient ${id.slice(0, 8)}`
  );
});

describe("TherapistSchedulePage", () => {
  it("lists appointments with patient name, session type and status", () => {
    schedule.mockReturnValue({ ...idle, data: { appointments: [apt] } });
    render(<TherapistSchedulePage />);
    expect(screen.getByText("Amina Uwase")).toBeInTheDocument();
    expect(screen.getByText(/Video call/)).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    schedule.mockReturnValue({ ...idle, isLoading: true });
    render(<TherapistSchedulePage />);
    expect(screen.getByText("Loading your schedule…")).toBeInTheDocument();
  });

  it("shows the empty state when there are no appointments", () => {
    schedule.mockReturnValue({ ...idle, data: { appointments: [] } });
    render(<TherapistSchedulePage />);
    expect(screen.getByText("No appointments")).toBeInTheDocument();
  });

  it("shows only the error, not the empty state, when loading fails", () => {
    schedule.mockReturnValue({ ...idle, isError: true });
    render(<TherapistSchedulePage />);
    expect(screen.getByText("Could not load your schedule.")).toBeInTheDocument();
    expect(screen.queryByText("No appointments")).not.toBeInTheDocument();
  });
});

describe("TherapistDashboardPage", () => {
  const data = {
    todaysSessions: [{ ...apt, status: "CONFIRMED" }],
    pendingCount: 2,
    upcomingCount: 5,
    patientCount: 3,
  };

  it("shows stats and today's sessions with the patient name", () => {
    dashboard.mockReturnValue({ ...idle, data });
    render(<TherapistDashboardPage />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/Amina Uwase/)).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    dashboard.mockReturnValue({ ...idle, isLoading: true });
    render(<TherapistDashboardPage />);
    expect(screen.getByText(/Loading today.s sessions/)).toBeInTheDocument();
  });

  it("shows the empty state when there are no sessions today", () => {
    dashboard.mockReturnValue({ ...idle, data: { ...data, todaysSessions: [] } });
    render(<TherapistDashboardPage />);
    expect(screen.getByText("No sessions today")).toBeInTheDocument();
  });

  it("on error shows the banner with dashes instead of zero stats and no empty state", () => {
    dashboard.mockReturnValue({ ...idle, isError: true });
    render(<TherapistDashboardPage />);
    expect(screen.getByText(/Could not load your dashboard/)).toBeInTheDocument();
    expect(screen.getAllByText("–")).toHaveLength(3);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("No sessions today")).not.toBeInTheDocument();
  });
});

describe("TherapistPatientsPage", () => {
  const list = {
    patients: [
      { patientId: "p1", userName: "Amina Uwase", totalSessions: 4, lastSessionAt: null },
      { patientId: "22222222-x", userName: null, totalSessions: 1, lastSessionAt: null },
    ],
    total: 2,
    page: 1,
    limit: 20,
  };

  it("lists patients, falling back to a short id when there is no name", () => {
    patients.mockReturnValue({ ...idle, data: list });
    render(<TherapistPatientsPage />);
    expect(screen.getByText("Amina Uwase")).toBeInTheDocument();
    expect(screen.getByText("Patient 22222222")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    patients.mockReturnValue({ ...idle, isLoading: true });
    render(<TherapistPatientsPage />);
    expect(screen.getByText("Loading patients…")).toBeInTheDocument();
  });

  it("shows the empty state when there are no patients", () => {
    patients.mockReturnValue({ ...idle, data: { ...list, patients: [], total: 0 } });
    render(<TherapistPatientsPage />);
    expect(screen.getByText(/have any patients yet/)).toBeInTheDocument();
  });

  it("shows only the error, not the empty state, when loading fails", () => {
    patients.mockReturnValue({ ...idle, isError: true });
    render(<TherapistPatientsPage />);
    expect(screen.getByText("Could not load your patients.")).toBeInTheDocument();
    expect(screen.queryByText(/have any patients yet/)).not.toBeInTheDocument();
  });
});
