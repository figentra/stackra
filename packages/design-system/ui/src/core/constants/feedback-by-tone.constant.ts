/**
 * Stackra file contract:
 * Purpose: what Toast, Alert and AlertDialog draw and announce for each tone: the default icon, and the live-region
 *          role that decides how assertively assistive technology reads the message (`alert` interrupts, `status`
 *          waits).
 * Boundary: data only; each runtime applies the role (web: the `role` attribute, native: `accessibilityLiveRegion`).
 *          Internal: not in the `.` barrel, `react/` and `native/` import it by path.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 4.1.3 (status messages).
 */
import type { IconName } from "@stackra/icons/contracts";
import type { Tone } from "#contracts/enums/tone.enum";

/** The default icon and announcement role of one tone. */
export interface Feedback {
  /** The icon drawn when the caller gives none. */
  readonly icon: IconName;
  /** `alert` for a message the user must hear now (a failure or a warning), `status` for the rest. */
  readonly role: "alert" | "status";
}

/** The icon and role of each tone; `default` and `accent` read as information, so they share one icon. */
export const FEEDBACK_BY_TONE = Object.freeze({
  default: { icon: "info", role: "status" },
  accent: { icon: "info", role: "status" },
  success: { icon: "circle-check", role: "status" },
  warning: { icon: "triangle-alert", role: "alert" },
  danger: { icon: "circle-alert", role: "alert" },
} as const satisfies Record<Tone, Feedback>);
