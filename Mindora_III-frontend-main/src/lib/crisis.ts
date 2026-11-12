// Single source of truth for crisis numbers and the crisis threshold.

export const EMERGENCY_NUMBER = "112";
export const EMERGENCY_HREF = `tel:${EMERGENCY_NUMBER}`;

export const CRISIS_LINE = {
  display: "+250 783 974 066",
  href: "tel:+250783974066",
} as const;

// Backend contract: crisisLevel is 0-5 and 5 is the safety interstitial.
export const CRISIS_LEVEL_THRESHOLD = 5;

export function isCrisisResponse(r: { crisisLevel: number }): boolean {
  return r.crisisLevel >= CRISIS_LEVEL_THRESHOLD;
}
