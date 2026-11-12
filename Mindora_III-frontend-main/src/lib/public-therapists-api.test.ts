import { getPublicTherapists, toPublicTherapist } from "@/lib/public-therapists-api";
import { fetchTherapists } from "@/lib/appointments-api";
import { THERAPISTS } from "@/lib/mock-data/therapists";
import type { TherapistProfile } from "@/types/domain";

jest.mock("@/lib/appointments-api", () => ({ fetchTherapists: jest.fn() }));
const mockedFetch = fetchTherapists as jest.Mock;

const profile: TherapistProfile = {
  id: "tp-1",
  userId: "user-1",
  userName: "Dr Uwase Diane",
  bio: "First paragraph.\n\nSecond paragraph.",
  timezone: "Africa/Kigali",
  languagePreference: "en",
  specialisation: "Anxiety",
  languages: ["English"],
  isAcceptingPatients: true,
  photoUrl: null,
};

beforeEach(() => mockedFetch.mockReset());

describe("getPublicTherapists", () => {
  it("returns labelled mock data and never calls the API when logged out", async () => {
    const result = await getPublicTherapists(false);
    expect(result.source).toBe("mock");
    expect(result.therapists).toBe(THERAPISTS);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("uses the real endpoint when logged in, keyed by userId", async () => {
    mockedFetch.mockResolvedValue({ therapists: [profile], total: 1, page: 1, limit: 50 });
    const result = await getPublicTherapists(true);
    expect(mockedFetch).toHaveBeenCalledWith({ limit: 50 });
    expect(result.source).toBe("live");
    expect(result.therapists[0]).toMatchObject({ id: "user-1", name: "Dr Uwase Diane" });
  });

  it("lets API errors propagate instead of falling back to mock data", async () => {
    mockedFetch.mockRejectedValue(new Error("boom"));
    await expect(getPublicTherapists(true)).rejects.toThrow("boom");
  });
});

describe("toPublicTherapist", () => {
  it("does not invent stats and splits the bio into paragraphs", () => {
    const t = toPublicTherapist(profile);
    expect(t.bio).toEqual(["First paragraph.", "Second paragraph."]);
    expect(t.rating).toBeUndefined();
    expect(t.price60).toBeUndefined();
    expect(t.title).toBe("Anxiety");
  });

  it("handles a missing name, bio and specialisation", () => {
    const t = toPublicTherapist({ ...profile, userName: null, bio: null, specialisation: null });
    expect(t).toMatchObject({ name: "Therapist", title: "Therapist", specialisations: [] });
    expect(t.bio).toBeUndefined();
  });
});
