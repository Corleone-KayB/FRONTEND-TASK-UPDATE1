import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuspendTherapistDialog } from "@/components/admin/SuspendTherapistDialog";
import { useReactivateTherapist, useSuspendTherapist } from "@/hooks/useAdmin";

jest.mock("@/hooks/useAdmin", () => ({
  useSuspendTherapist: jest.fn(),
  useReactivateTherapist: jest.fn(),
}));

const mockedUseSuspendTherapist = useSuspendTherapist as jest.Mock;
const mockedUseReactivateTherapist = useReactivateTherapist as jest.Mock;

describe("SuspendTherapistDialog", () => {
  const suspendMutateAsync = jest.fn();
  const reactivateMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSuspendTherapist.mockReturnValue({
      mutateAsync: suspendMutateAsync,
      reset: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
    mockedUseReactivateTherapist.mockReturnValue({
      mutateAsync: reactivateMutateAsync,
      reset: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("disables the Suspend button until a reason is entered, and calls the suspend mutation on confirm", async () => {
    const user = userEvent.setup();
    render(
      <SuspendTherapistDialog
        target={{ userId: "user-1", name: "Dr. Jane", action: "suspend" }}
        onOpenChange={jest.fn()}
      />
    );

    const suspendButton = screen.getByRole("button", { name: "Suspend" });
    expect(suspendButton).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText(/why are you taking this action/i),
      "Repeated no-shows reported by patients."
    );
    expect(suspendButton).toBeEnabled();

    await user.click(suspendButton);

    expect(suspendMutateAsync).toHaveBeenCalledWith({
      id: "user-1",
      reason: "Repeated no-shows reported by patients.",
    });
    expect(reactivateMutateAsync).not.toHaveBeenCalled();
  });

  it("uses the reactivate mutation and label when action is 'reactivate'", async () => {
    const user = userEvent.setup();
    render(
      <SuspendTherapistDialog
        target={{ userId: "user-1", name: "Dr. Jane", action: "reactivate" }}
        onOpenChange={jest.fn()}
      />
    );

    const reactivateButton = screen.getByRole("button", { name: "Reactivate" });
    await user.type(
      screen.getByPlaceholderText(/why are you taking this action/i),
      "Investigation concluded, no issue found."
    );
    await user.click(reactivateButton);

    expect(reactivateMutateAsync).toHaveBeenCalledWith({
      id: "user-1",
      reason: "Investigation concluded, no issue found.",
    });
    expect(suspendMutateAsync).not.toHaveBeenCalled();
  });
});
