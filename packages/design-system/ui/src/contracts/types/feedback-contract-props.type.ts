/**
 * Stackra file contract:
 * Purpose: the props Toast, Alert and AlertDialog share to say what kind of message they carry: the tone, which sets
 *          the colour, the default icon and how assertively assistive technology announces it, and an icon that
 *          replaces or removes the default. HeroUI names the tone `status` on an Alert and `variant` on a Toast, and the
 *          three take the five `Tone` values as they are.
 * Boundary: types only; `FEEDBACK_BY_TONE` holds the icon and the announcement role of each tone.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 4.1.3.
 */
import type { Tone } from "@stackra/contracts";

import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props shared by Alert, AlertDialog and Toast on web and native. */
export interface FeedbackContractProps {
  /** The kind of message. Defaults to `default`; `danger` and `warning` are announced at once. */
  readonly tone?: Tone | undefined;
  /** An icon in place of the tone's own, or `false` for none. Left out, the tone's icon is drawn. */
  readonly icon?: IconSlot | false | undefined;
}
