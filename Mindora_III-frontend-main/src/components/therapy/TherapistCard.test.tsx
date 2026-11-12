import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TherapistCard } from "@/components/therapy/TherapistCard";
import type { TherapistProfile } from "@/types/domain";

jest.mock("@/hooks/useDominantColor", () => ({
  useDominantColor: () => null,
  isLightColor: () => false,
}));

const therapist: TherapistProfile = {
  id: "tp-1",
  userId: "user-1",
  userName: "Dr Uwase Diane",
  bio: null,
  timezone: "Africa/Kigali",
  languagePreference: "en",
  specialisation: "Anxiety",
  languages: ["English"],
  isAcceptingPatients: true,
  photoUrl: null,
};

const FLIPPED = /(^| )\[transform:rotateY\(180deg\)\]/;

// jsdom has no hover or CSS, so these cover the state-driven flip that touch and
// keyboard users rely on: the class that rotates the card, and the controls.
function flipper() {
  return screen.getByRole("button", { name: /show details/i }).parentElement!.parentElement!;
}

describe("TherapistCard flip without hover", () => {
  it("flips on tap of the front face and flips back from the back face", async () => {
    const user = userEvent.setup();
    render(<TherapistCard therapist={therapist} index={0} onBook={jest.fn()} />);
    expect(flipper().className).not.toMatch(FLIPPED);

    await user.click(screen.getByRole("button", { name: "Show details for Dr Uwase Diane" }));
    expect(flipper().className).toMatch(FLIPPED);

    await user.click(screen.getByRole("button", { name: "Back to photo" }));
    expect(flipper().className).not.toMatch(FLIPPED);
  });

  it("keeps Get started a real, tall-enough button that calls onBook", async () => {
    const user = userEvent.setup();
    const onBook = jest.fn();
    render(<TherapistCard therapist={therapist} index={0} onBook={onBook} />);
    const button = screen.getByRole("button", { name: /get started/i });
    expect(button.className).toContain("min-h-11");
    await user.click(button);
    expect(onBook).toHaveBeenCalledTimes(1);
  });

  it("does not offer Get started when the therapist is not accepting patients", () => {
    render(
      <TherapistCard
        therapist={{ ...therapist, isAcceptingPatients: false }}
        index={0}
        onBook={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /not accepting patients/i })).toBeDisabled();
  });
});
