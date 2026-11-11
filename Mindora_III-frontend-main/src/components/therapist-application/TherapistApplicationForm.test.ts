import { therapistApplicationSchema } from "@/components/therapist-application/TherapistApplicationForm";

function validValues() {
  return {
    fullName: "Uwase Diane",
    phoneNumber: "0788123456",
    contactEmail: "uwase.diane@example.com",
    professionalBio: "Ten years supporting patients through anxiety and grief.",
    qualifications: ["MSc Clinical Psychology"],
    certifications: [] as string[],
    licenseNumber: "RW-12345",
    licenseIssuingBody: "Rwanda Allied Health Professions Council",
    licenseExpiryDate: null,
    professionalRegistrationNumber: null,
    specialisations: ["Anxiety", "Grief"],
    yearsOfExperience: 10,
    languages: ["Kinyarwanda", "English"],
    availabilitySummary: null,
    location: "Kigali",
    timezone: "Africa/Kigali",
  };
}

describe("therapistApplicationSchema", () => {
  it("accepts a fully valid application", () => {
    const result = therapistApplicationSchema.safeParse(validValues());
    expect(result.success).toBe(true);
  });

  it("accepts the optional fields being omitted / null", () => {
    const result = therapistApplicationSchema.safeParse({
      ...validValues(),
      licenseExpiryDate: null,
      professionalRegistrationNumber: null,
      availabilitySummary: null,
    });
    expect(result.success).toBe(true);
  });

  describe("yearsOfExperience bounds", () => {
    it("rejects a negative value", () => {
      const result = therapistApplicationSchema.safeParse({
        ...validValues(),
        yearsOfExperience: -1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a value above 70", () => {
      const result = therapistApplicationSchema.safeParse({
        ...validValues(),
        yearsOfExperience: 71,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a non-integer value", () => {
      const result = therapistApplicationSchema.safeParse({
        ...validValues(),
        yearsOfExperience: 5.5,
      });
      expect(result.success).toBe(false);
    });

    it("accepts the boundary values 0 and 70", () => {
      expect(
        therapistApplicationSchema.safeParse({ ...validValues(), yearsOfExperience: 0 }).success
      ).toBe(true);
      expect(
        therapistApplicationSchema.safeParse({ ...validValues(), yearsOfExperience: 70 }).success
      ).toBe(true);
    });
  });

  describe("specialisations min-length", () => {
    it("rejects an empty specialisations list", () => {
      const result = therapistApplicationSchema.safeParse({
        ...validValues(),
        specialisations: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 10 specialisations", () => {
      const result = therapistApplicationSchema.safeParse({
        ...validValues(),
        specialisations: Array.from({ length: 11 }, (_, i) => `Specialisation ${i}`),
      });
      expect(result.success).toBe(false);
    });

    it("accepts a single specialisation", () => {
      const result = therapistApplicationSchema.safeParse({
        ...validValues(),
        specialisations: ["Anxiety"],
      });
      expect(result.success).toBe(true);
    });
  });

  it("rejects an invalid contact email", () => {
    const result = therapistApplicationSchema.safeParse({
      ...validValues(),
      contactEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty qualifications list", () => {
    const result = therapistApplicationSchema.safeParse({ ...validValues(), qualifications: [] });
    expect(result.success).toBe(false);
  });
});
