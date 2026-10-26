/**
 * Stackra file contract:
 * Purpose: `FeedbackIconProps`, the props of the web `FeedbackIcon` in `feedback-icon.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          10); ADR 0312 (decision 3); WCAG 2.2 SC 1.4.1.
 */
import type { Tone } from "#contracts/enums/tone.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props of FeedbackIcon. */
export interface FeedbackIconProps {
  /** The tone of the message, which picks the default icon. */
  readonly tone: Tone;
  /** The caller's icon: a name or an element. Left out, the tone's icon is drawn. */
  readonly icon?: IconSlot | undefined;
}
