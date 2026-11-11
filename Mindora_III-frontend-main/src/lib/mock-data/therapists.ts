export type TherapistGender = "male" | "female";

export interface Therapist {
  id: string;
  name: string;
  title: string;
  photo?: string;
  bio?: string[];
  languages?: string[];
  inPerson?: boolean;
  phone?: string;
  email?: string;
  // Marketplace stats - only shown when we actually have them, never
  // placeholder numbers for a real practitioner.
  sessions?: string;
  rating?: number;
  reviews?: number;
  nearest?: string;
  price60?: number;
  price30?: number;
  specialisations: string[];
  gender: TherapistGender;
  clientsChoice: boolean;
  availableToday: boolean;
  availableThisWeek: boolean;
  online: boolean;
}

export const SPECIALISATION_OPTIONS = [
  "Depression",
  "Anxiety",
  "OCD",
  "PTSD",
  "Trauma",
  "Stress",
  "Addiction",
  "Couple therapy",
  "Mood disorder",
  "Eating disorder",
] as const;

// Static directory until the therapist pages are wired to user-service's
// therapist profiles. Details come from the therapist's own profile sheet.
export const THERAPISTS: Therapist[] = [
  {
    id: "nsengiyumva-athanase",
    name: "Nsengiyumva Athanase",
    title: "Clinical Psychologist",
    photo: "/images/therapists/nsengiyumva-athanase.jpg",
    bio: [
      "Psychological support is provided in a safe and supportive space for healing, emotional recovery, and personal growth through professional psychological care.",
      "Support is available either face-to-face or online, depending on what feels most comfortable and accessible.",
      "Services are offered in Kinyarwanda, English, and French, allowing people to express themselves freely in the language they prefer. Whether in-person or virtually, the goal is to ensure people feel heard, supported, and guided toward healing and resilience.",
    ],
    specialisations: [
      "Individual therapy",
      "Problem Management Plus (PM+)",
      "Family therapy",
      "Couple therapy",
      "Motivational therapy",
      "Trauma-focused therapy",
      "Cognitive Behaviour Therapy (CBT)",
      "Resilience Oriented Therapy (ROT)",
    ],
    languages: ["Kinyarwanda", "English", "French"],
    inPerson: true,
    online: true,
    phone: "+250 788 686 340",
    email: "athanasensengiyumva@gmail.com",
    gender: "male",
    clientsChoice: false,
    availableToday: false,
    availableThisWeek: false,
  },
];

export function sessionModes(therapist: Pick<Therapist, "online" | "inPerson">) {
  return [therapist.inPerson ? "In-person" : null, therapist.online ? "Online" : null]
    .filter(Boolean)
    .join(" & ");
}

export function therapistInitials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function matchesSpecialisation(specialisations: string[], query: string | null | undefined) {
  if (!query || query === "Others") return true;
  const normalised = query.toLowerCase().replace(/s$/, "");
  return specialisations.some((item) => {
    const value = item.toLowerCase();
    return value.includes(normalised) || normalised.includes(value.replace(/s$/, ""));
  });
}

export function getTherapistById(id: string) {
  return THERAPISTS.find((therapist) => therapist.id === id);
}
