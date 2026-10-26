/**
 * Stackra file contract:
 * Purpose: `BusinessDayBoundary`, the local wall-clock time a business day starts, so a sale at 01:30 belongs to the
 *          day before when the day starts at 04:00 (a restaurant's business day running past midnight).
 * Boundary: a type only, a setting. Night opening hours are already a `BusinessCalendar` span whose end is not after
 *           its start; this only says which date a moment is booked to. `"00:00"` is the calendar day.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 3: calendar data); ADR 0044 (settings as typed values).
 */

/** Where one business day ends and the next begins. */
export interface BusinessDayBoundary {
  /** The IANA time zone the boundary is read in. */
  readonly timeZone: string;

  /** The local time the business day starts, `HH:mm` (`"04:00"`). */
  readonly startsAt: string;
}
