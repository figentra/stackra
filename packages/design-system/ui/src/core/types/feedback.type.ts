/**
 * Stackra file contract:
 * Purpose: `Feedback`: the default icon and announcement role of one tone.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 4.1.3 (status messages).
 */
import type { IconName } from "@stackra/icons/contracts";

/** The default icon and announcement role of one tone. */
export interface Feedback {
  /** The icon drawn when the caller gives none. */
  readonly icon: IconName;
  /** `alert` for a message the user must hear now (a failure or a warning), `status` for the rest. */
  readonly role: "alert" | "status";
}
