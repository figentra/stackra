/**
 * Stackra file contract:
 * Purpose: `FeedbackIconProps`, the props of the native `FeedbackIcon` in `feedback-icon.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          10); ADR 0312 (decision 3); WCAG 2.2 SC 1.4.1.
 */
import type { Tone } from "@stackra/contracts";

import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props of FeedbackIcon. */
export interface FeedbackIconProps {
  /** The tone of the message, which picks the default icon and its colour. */
  readonly tone: Tone;
  /** The caller's icon: a name or an element. Left out, the tone's icon is drawn. */
  readonly icon?: IconSlot | undefined;
}
