import { render, screen } from "@testing-library/react";
import BookAppointmentPage from "./page";
import { useTherapists } from "@/hooks/useTherapists";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
jest.mock("@/hooks/useTherapists", () => ({ useTherapists: jest.fn() }));
jest.mock("@/components/public/BackLink", () => ({ BackLink: () => null }));
jest.mock("@/components/therapy/BookingDialog", () => ({
  BookingDialog: ({ therapist }: { therapist: { userId: string } | null }) => (
    <div data-testid="dialog">{therapist?.userId}</div>
  ),
}));
// React's use() needs a settled promise; supply one that is already resolved.
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  use: (value: { id?: string }) => value,
}));

const mocked = useTherapists as jest.Mock;
const params = { id: "user-1" } as unknown as Promise<{ id: string }>;
const profile = { id: "tp-1", userId: "user-1", userName: "Dr Uwase Diane" };

describe("BookAppointmentPage", () => {
  it("opens the real BookingDialog for a therapist found by userId", () => {
    mocked.mockReturnValue({ data: { therapists: [profile] }, isLoading: false, isError: false });
    render(<BookAppointmentPage params={params} />);
    expect(screen.getByTestId("dialog")).toHaveTextContent("user-1");
    expect(screen.queryByText(/coming soon|connect to the appointments service/i)).toBeNull();
  });

  it("shows a not-found state with a link back when the id is unknown", () => {
    mocked.mockReturnValue({ data: { therapists: [] }, isLoading: false, isError: false });
    render(<BookAppointmentPage params={params} />);
    expect(screen.getByText("Therapist not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to therapists" })).toHaveAttribute(
      "href",
      "/therapy"
    );
  });

  it("says the list could not be loaded on error", () => {
    mocked.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<BookAppointmentPage params={params} />);
    expect(screen.getByText("We couldn't load this therapist")).toBeInTheDocument();
  });
});
