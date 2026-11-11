import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApproveApplicationDialog } from "@/components/admin/ApproveApplicationDialog";
import { useApproveTherapistApplication } from "@/hooks/useAdmin";

jest.mock("@/hooks/useAdmin", () => ({
  useApproveTherapistApplication: jest.fn(),
}));

const mockedUseApproveTherapistApplication = useApproveTherapistApplication as jest.Mock;

describe("ApproveApplicationDialog", () => {
  const mutateAsync = jest.fn();
  const reset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseApproveTherapistApplication.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("does not render dialog content when there is no applicationId", () => {
    render(<ApproveApplicationDialog applicationId={null} onOpenChange={jest.fn()} />);
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("confirms approval with the given applicationId", async () => {
    mutateAsync.mockResolvedValueOnce({});
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(
      <ApproveApplicationDialog
        applicationId="app-1"
        applicantName="Uwase Diane"
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText(/Uwase Diane's application/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(mutateAsync).toHaveBeenCalledWith("app-1");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the mutation's error message and does not close the dialog on failure", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("boom"));
    mockedUseApproveTherapistApplication.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      isError: true,
      error: { message: "Could not approve this application." },
    });
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(<ApproveApplicationDialog applicationId="app-1" onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(screen.getByText("Could not approve this application.")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
