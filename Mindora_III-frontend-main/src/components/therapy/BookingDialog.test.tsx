import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingDialog } from "@/components/therapy/BookingDialog";
import { useAvailability, useBookAppointment } from "@/hooks/useAppointments";
import type { TherapistProfile } from "@/types/domain";

jest.mock("@/hooks/useAppointments", () => ({
  useAvailability: jest.fn(),
  useBookAppointment: jest.fn(),
}));

const mockedUseAvailability = useAvailability as jest.Mock;
const mockedUseBookAppointment = useBookAppointment as jest.Mock;

const therapist: TherapistProfile = {
  id: "tp-1",
  userId: "user-1",
  userName: "Dr Uwase Diane",
  bio: null,
  timezone: "Africa/Kigali",
  languagePreference: "en",
  specialisation: "Anxiety",
  languages: ["en"],
  isAcceptingPatients: true,
  photoUrl: null,
};

const slot = { slotStart: "2030-01-15T09:00:00.000Z", slotEnd: "2030-01-15T09:50:00.000Z" };

function availability(overrides: Record<string, unknown> = {}) {
  mockedUseAvailability.mockReturnValue({
    data: { therapistId: "user-1", slots: [slot] },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...overrides,
  });
}

async function pickSlotAndReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Video call" }));
  await user.click(screen.getByRole("button", { name: /\d{1,2}:\d{2}/ }));
  await user.click(screen.getByRole("button", { name: "Review booking" }));
}

async function confirm(user: ReturnType<typeof userEvent.setup>) {
  render(<BookingDialog therapist={therapist} onOpenChange={jest.fn()} />);
  await pickSlotAndReview(user);
  await user.click(screen.getByRole("button", { name: "Confirm booking" }));
}

describe("BookingDialog", () => {
  const mutateAsync = jest.fn();
  const reset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    availability();
    mockedUseBookAppointment.mockReturnValue({ mutateAsync, reset, isPending: false });
  });

  it("shows a loading state while slots load", () => {
    availability({ data: undefined, isLoading: true });
    render(<BookingDialog therapist={therapist} onOpenChange={jest.fn()} />);
    expect(screen.getByText("Loading open slots…")).toBeInTheDocument();
  });

  it("shows a review step with therapist, session type, date and time before booking", async () => {
    const user = userEvent.setup();
    render(<BookingDialog therapist={therapist} onOpenChange={jest.fn()} />);
    await pickSlotAndReview(user);

    expect(screen.getByText("Review your booking")).toBeInTheDocument();
    expect(screen.getByText("Dr Uwase Diane", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("Video call", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("books and shows the success screen", async () => {
    mutateAsync.mockResolvedValueOnce({ kind: "success", appointment: {} });
    await confirm(userEvent.setup());

    expect(mutateAsync).toHaveBeenCalledWith({
      therapistId: "user-1",
      slotStart: slot.slotStart,
      slotEnd: slot.slotEnd,
      sessionType: "VIDEO",
    });
    expect(await screen.findByText("Booking requested")).toBeInTheDocument();
    expect(screen.getByText(/pending therapist confirmation/i)).toBeInTheDocument();
  });

  it("on conflict returns to slot selection with the server's friendly message", async () => {
    mutateAsync.mockResolvedValueOnce({ kind: "conflict", message: "Someone beat you to 9:00." });
    await confirm(userEvent.setup());

    expect(await screen.findByText("Someone beat you to 9:00.")).toBeInTheDocument();
    expect(screen.getByText("Select a date")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select a time" })).toBeDisabled();
  });

  it("on conflict without a message falls back to the built-in friendly text", async () => {
    mutateAsync.mockResolvedValueOnce({ kind: "conflict" });
    await confirm(userEvent.setup());

    expect(await screen.findByText(/just booked by someone else/i)).toBeInTheDocument();
  });

  it("shows an empty state when there is no availability at all", () => {
    availability({ data: { therapistId: "user-1", slots: [] } });
    render(<BookingDialog therapist={therapist} onOpenChange={jest.fn()} />);
    expect(screen.getByText("No open times right now")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose session type" })).toBeDisabled();
  });

  it("shows a retry when availability fails to load", async () => {
    const refetch = jest.fn();
    availability({ data: undefined, isError: true, refetch });
    const user = userEvent.setup();
    render(<BookingDialog therapist={therapist} onOpenChange={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
    expect(screen.queryByText("No open times right now")).not.toBeInTheDocument();
  });

  it("shows a generic error on the review step so the user can retry", async () => {
    mutateAsync.mockResolvedValueOnce({ kind: "error", network: false });
    await confirm(userEvent.setup());

    expect(await screen.findByText(/Could not book this session/i)).toBeInTheDocument();
    expect(screen.getByText("Review your booking")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it("shows a network-specific error when the server cannot be reached", async () => {
    mutateAsync.mockResolvedValueOnce({ kind: "error", network: true });
    await confirm(userEvent.setup());

    expect(await screen.findByText(/Could not reach the server/i)).toBeInTheDocument();
  });
});
