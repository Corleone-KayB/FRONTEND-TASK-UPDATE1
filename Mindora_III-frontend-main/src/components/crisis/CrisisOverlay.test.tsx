import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CrisisProvider, useCrisis } from "@/contexts/CrisisContext";
import { CrisisOverlay } from "./CrisisOverlay";

function Harness({ message }: { message?: string }) {
  const { trigger } = useCrisis();
  return <button onClick={() => trigger("ai-chat", message)}>go</button>;
}

function setup(message?: string) {
  render(
    <CrisisProvider>
      <Harness message={message} />
      <CrisisOverlay />
    </CrisisProvider>
  );
}

describe("CrisisOverlay", () => {
  it("is closed until triggered", () => {
    setup();
    expect(screen.queryByText(/call 112/i)).toBeNull();
  });

  it("shows 112 and the crisis line, with fallback copy when no message", async () => {
    setup();
    await userEvent.click(screen.getByText("go"));
    const link = await screen.findByRole("link", { name: /call 112/i });
    expect(link).toHaveAttribute("href", "tel:112");
    expect(screen.getByRole("link", { name: /\+250 783 974 066/ })).toHaveAttribute(
      "href",
      "tel:+250783974066"
    );
    expect(screen.getByText(/reach out for help/i)).toBeInTheDocument();
  });

  it("shows backend message verbatim and dismisses", async () => {
    setup("Clinical copy.");
    await userEvent.click(screen.getByText("go"));
    expect(await screen.findByText("Clinical copy.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /safe right now/i }));
    expect(screen.queryByText("Clinical copy.")).toBeNull();
  });
});
