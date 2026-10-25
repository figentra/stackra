/**
 * Stackra file contract:
 * Purpose: `QuietHours`, the local window in which non-mandatory notifications wait: its start and end as `HH:mm` and
 *          the recipient's time zone.
 * Boundary: a type only; settings data (`settings:product-default:quiet-hours`, changeable at the user layer, OS-196).
 *           A window whose end is before its start runs over midnight.
 * Runtime: isomorphic
 * Governing contract: OS-196; ADR 0086 (decision 1: quiet hours).
 */

/** A quiet window. */
export interface QuietHours {
  /** Local start, `HH:mm` (`"22:00"`). */
  readonly start: string;

  /** Local end, `HH:mm` (`"07:00"`). */
  readonly end: string;

  /** The IANA time zone the window is read in (`Asia/Riyadh`). */
  readonly timeZone: string;
}
