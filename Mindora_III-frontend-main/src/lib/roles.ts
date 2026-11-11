import type { UserRole } from "@/types/domain";

// Where each role lands after login, or gets redirected to if it strays onto a route
// gated for a different role.
export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "THERAPIST":
      return "/therapist";
    case "PATIENT":
      return "/today";
  }
}
