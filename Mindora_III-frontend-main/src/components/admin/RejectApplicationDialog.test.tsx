import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RejectApplicationDialog } from "@/components/admin/RejectApplicationDialog";
import { useRejectTherapistApplication } from "@/hooks/useAdmin";

jest.mock("@/hooks/useAdmin", () => ({
  useRejectTherapistApplication: jest.fn(),
}));

const mockedUseRejectTherapistApplication = useRejectTherapistApplication as jest.Mock;

describe("RejectApplicationDialog", () => {
  const mutateAsync = jest.fn();
  const reset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRejectTherapistApplication.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("disables the Reject button until a reason is entered", async () => {
    const user = userEvent.setup();
    render(
      <RejectApplicationDialog
        applicationId="app-1"
        applicantName="Uwase Diane"
        onOpenChange={jest.fn()}
      />
    );

    const rejectButton = screen.getByRole("button", { name: "Reject" });
    expect(rejectButton).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText(/why is this application being rejected/i),
      "Missing license documentation"
    );

    expect(rejectButton).toBeEnabled();
  });

  it("does not call the mutation when the reason is only whitespace", async () => {
    const user = userEvent.setup();
    render(<RejectApplicationDialog applicationId="app-1" onOpenChange={jest.fn()} />);

    const textarea = screen.getByPlaceholderText(/why is this application being rejected/i);
    await user.type(textarea, "   ");

    const rejectButton = screen.getByRole("button", { name: "Reject" });
    expect(rejectButton).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("submits the trimmed reason to the mutation when confirmed", async () => {
    mutateAsync.mockResolvedValueOnce({});
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(<RejectApplicationDialog applicationId="app-1" onOpenChange={onOpenChange} />);

    const textarea = screen.getByPlaceholderText(/why is this application being rejected/i);
    await user.type(textarea, "  Missing license documentation  ");
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "app-1",
      reason: "Missing license documentation",
    });
  });
});
