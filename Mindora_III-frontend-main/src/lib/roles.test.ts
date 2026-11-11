import { dashboardPathForRole } from "@/lib/roles";

describe("dashboardPathForRole", () => {
  it("routes each role to its own dashboard", () => {
    expect(dashboardPathForRole("PATIENT")).toBe("/today");
    expect(dashboardPathForRole("THERAPIST")).toBe("/therapist");
    expect(dashboardPathForRole("ADMIN")).toBe("/admin");
  });
});
