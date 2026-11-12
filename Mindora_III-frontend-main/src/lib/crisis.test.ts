import { CRISIS_LINE, EMERGENCY_NUMBER, isCrisisResponse } from "./crisis";

describe("crisis helpers", () => {
  it("flags only level 5", () => {
    expect(isCrisisResponse({ crisisLevel: 4 })).toBe(false);
    expect(isCrisisResponse({ crisisLevel: 5 })).toBe(true);
  });
  it("exposes the configured numbers", () => {
    expect(EMERGENCY_NUMBER).toBe("112");
    expect(CRISIS_LINE.href).toBe("tel:+250783974066");
  });
});
