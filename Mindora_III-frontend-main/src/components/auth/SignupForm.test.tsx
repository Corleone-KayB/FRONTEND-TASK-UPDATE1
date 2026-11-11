import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "@/components/auth/SignupForm";
import { useAuth } from "@/contexts/AuthContext";

// jsdom has no ResizeObserver; @radix-ui/react-use-size (used by the
// Checkbox primitive) needs one to exist, even though the size it measures
// is irrelevant to these tests.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;

describe("SignupForm", () => {
  const register = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ register });
  });

  it("starts with the terms checkbox unchecked - it must never be pre-agreed on the user's behalf", () => {
    render(<SignupForm />);
    expect(screen.getByRole("checkbox", { name: /i agree to mindora/i })).not.toBeChecked();
  });

  it("blocks submission with a validation error until terms is checked, even with otherwise valid fields", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/what should we call you/i), "Theodora");
    await user.type(screen.getByLabelText("Email"), "theodora@example.com");
    await user.type(screen.getByLabelText("Password"), "a-valid-password");
    await user.click(screen.getByRole("button", { name: /create my space/i }));

    expect(await screen.findByText("You must agree to continue")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("submits once terms is explicitly checked", async () => {
    register.mockResolvedValueOnce({ role: "PATIENT" });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/what should we call you/i), "Theodora");
    await user.type(screen.getByLabelText("Email"), "theodora@example.com");
    await user.type(screen.getByLabelText("Password"), "a-valid-password");
    await user.click(screen.getByRole("checkbox", { name: /i agree to mindora/i }));
    await user.click(screen.getByRole("button", { name: /create my space/i }));

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "theodora@example.com",
        password: "a-valid-password",
        role: "PATIENT",
        userName: "Theodora",
      })
    );
  });
});
