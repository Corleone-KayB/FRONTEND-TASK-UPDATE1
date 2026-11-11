import { scoreTest, getTestById } from "@/lib/mock-data/tests";
import { THERAPISTS } from "@/lib/mock-data/therapists";

describe("Public mock data", () => {
  it("lists real therapists only, with no placeholder stats", () => {
    expect(THERAPISTS.map((therapist) => therapist.name)).toEqual(["Nsengiyumva Athanase"]);
    for (const therapist of THERAPISTS) {
      expect(therapist.rating).toBeUndefined();
      expect(therapist.reviews).toBeUndefined();
      expect(therapist.nearest).toBeUndefined();
    }
  });

  it("scores GAD-7 moderate at 14", () => {
    const test = getTestById("gad7");
    expect(test).toBeDefined();
    const answers = { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 };
    const result = scoreTest(test!, answers);
    expect(result.rawScore).toBe(14);
    expect(result.severity).toBe("Moderate");
  });

  it("counts ASRS primary indicators at Often or above", () => {
    const test = getTestById("asrs");
    const answers = { 0: 3, 1: 3, 2: 3, 3: 3, 4: 1, 5: 1 };
    const result = scoreTest(test!, answers);
    expect(result.rawScore).toBe(4);
    expect(result.extras?.[0].value).toContain("4 out of 6");
  });
});
