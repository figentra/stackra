/**
 * Stackra file contract:
 * Purpose: the live-region attributes a message of a tone carries, so an Alert and a Toast on either runtime announce
 *          a failure at once and good news politely from one rule.
 * Boundary: pure; reads `FEEDBACK_BY_TONE` and nothing else. Internal, not in the `.` barrel: the components import it
 *           by path. React Native reads `role` and `aria-live` as it reads them on the web.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 3); WCAG 2.2 SC 4.1.3 (status messages).
 */
import type { Tone } from "#contracts/enums/tone.enum";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";

/** The attributes that make an element announce its content. */
export interface LiveRegion {
  /** `alert` for a message that interrupts, `status` for one that waits. */
  readonly role: "alert" | "status";
  /** `assertive` for `alert`, `polite` for `status`; spelt out because not every screen reader infers it from the role. */
  readonly "aria-live": "assertive" | "polite";
}

/**
 * The live-region attributes of a tone.
 * @param tone - the tone of the message
 * @returns `alert` and `assertive` for warning and danger, `status` and `polite` for the other tones
 */
export function liveRegionOf(tone: Tone): LiveRegion {
  const { role } = FEEDBACK_BY_TONE[tone];
  return { role, "aria-live": role === "alert" ? "assertive" : "polite" };
}
