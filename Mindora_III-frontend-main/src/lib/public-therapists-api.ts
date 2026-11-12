import { fetchTherapists } from "@/lib/appointments-api";
import { THERAPISTS, type Therapist } from "@/lib/mock-data/therapists";
import type { TherapistProfile } from "@/types/domain";

// Single entry point for the public therapist pages (/therapists, /therapists/[id]).
//
// GET /api/v1/users/therapists needs a login (401 for anonymous callers, verified
// 2026-11-11) and BE2 has not said whether it will be opened. Until they do:
//   - logged in  -> the real endpoint (fetchTherapists, the same call useTherapists makes)
//   - logged out -> MOCK data from lib/mock-data/therapists.ts. It is NOT real
//     availability or real therapists and must never be sent to the booking APIs.
// When BE2 opens the endpoint, delete the mock branch below and nothing else changes.

export type PublicTherapistSource = "live" | "mock";

export interface PublicTherapistList {
  source: PublicTherapistSource;
  therapists: Therapist[];
}

// Live profiles are shown with the public card shape. `id` is TherapistProfile.userId
// because that is the id the booking APIs and /appointments/book/[id] use.
// Marketplace stats, prices, gender and availability flags are not on the live
// profile, so they stay unset instead of being invented.
export function toPublicTherapist(profile: TherapistProfile): Therapist {
  const bio = (profile.bio ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return {
    id: profile.userId,
    name: profile.userName ?? "Therapist",
    title: profile.specialisation ?? "Therapist",
    photo: profile.photoUrl ?? undefined,
    bio: bio.length ? bio : undefined,
    languages: profile.languages.length ? profile.languages : undefined,
    specialisations: profile.specialisation ? [profile.specialisation] : [],
    clientsChoice: false,
    availableToday: false,
    availableThisWeek: false,
    online: true, // bookings are VIDEO/AUDIO calls only
  };
}

export async function getPublicTherapists(isAuthenticated: boolean): Promise<PublicTherapistList> {
  if (isAuthenticated) {
    const response = await fetchTherapists({ limit: 50 });
    return { source: "live", therapists: response.therapists.map(toPublicTherapist) };
  }
  // MOCK: static sample directory for logged-out visitors.
  return { source: "mock", therapists: THERAPISTS };
}
