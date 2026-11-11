import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequestInfoDialog } from "@/components/admin/RequestInfoDialog";
import { useRequestTherapistApplicationInfo } from "@/hooks/useAdmin";

jest.mock("@/hooks/useAdmin", () => ({
  useRequestTherapistApplicationInfo: jest.fn(),
}));

const mockedUseRequestTherapistApplicationInfo = useRequestTherapistApplicationInfo as jest.Mock;

describe("RequestInfoDialog", () => {
  const mutateAsync = jest.fn();
  const reset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRequestTherapistApplicationInfo.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("disables the Request info button until a note is entered", async () => {
    const user = userEvent.setup();
    render(
      <RequestInfoDialog
        applicationId="app-1"
        applicantName="Uwase Diane"
        onOpenChange={jest.fn()}
      />
    );

    const submitButton = screen.getByRole("button", { name: "Request info" });
    expect(submitButton).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText(/what's missing or needs clarification/i),
      "Please upload a clearer copy of your license."
    );

    expect(submitButton).toBeEnabled();
  });

  it("does not call the mutation when the note is only whitespace", async () => {
    const user = userEvent.setup();
    render(<RequestInfoDialog applicationId="app-1" onOpenChange={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/what's missing or needs clarification/i), "   ");

    const submitButton = screen.getByRole("button", { name: "Request info" });
    expect(submitButton).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("submits the trimmed note to the mutation when confirmed", async () => {
    mutateAsync.mockResolvedValueOnce({});
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(<RequestInfoDialog applicationId="app-1" onOpenChange={onOpenChange} />);

    await user.type(
      screen.getByPlaceholderText(/what's missing or needs clarification/i),
      "  Please upload a clearer license copy.  "
    );
    await user.click(screen.getByRole("button", { name: "Request info" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "app-1",
      note: "Please upload a clearer license copy.",
    });
  });
});
