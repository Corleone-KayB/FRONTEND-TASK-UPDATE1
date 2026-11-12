import { render, screen } from "@testing-library/react";
import { BookingDialog } from "@/components/therapy/BookingDialog";
import { useAvailability, useBookAppointment } from "@/hooks/useAppointments";

jest.mock("@/hooks/useAppointments", () => ({
  useAvailability: jest.fn(),
  useBookAppointment: jest.fn(),
}));

const therapist = {
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

describe("BookingDialog touch targets", () => {
  it("gives session type and time-slot buttons a 44px minimum on touch widths", () => {
    (useAvailability as jest.Mock).mockReturnValue({
      data: {
        therapistId: "user-1",
        slots: [{ slotStart: "2030-01-15T09:00:00.000Z", slotEnd: "2030-01-15T09:50:00.000Z" }],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    (useBookAppointment as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    render(<BookingDialog therapist={therapist} onOpenChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Video call" }).className).toContain(
      "max-lg:min-h-11"
    );
    expect(screen.getByRole("button", { name: "Audio call" }).className).toContain(
      "max-lg:min-h-11"
    );
    const slot = screen.getAllByRole("button").find((b) => /\d:\d\d/.test(b.textContent ?? ""));
    expect(slot?.className).toContain("max-lg:min-h-11");
  });
});
