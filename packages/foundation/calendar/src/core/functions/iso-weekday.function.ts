/**
 * Stackra file contract:
 * Purpose: `isoWeekday`, the ISO weekday of a day number: 1 Monday to 7 Sunday, the numbering of
 *          `BusinessCalendar.workingWeek`.
 * Boundary: internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 3).
 */

/**
 * The ISO weekday of day number `day` (1970-01-01, day 0, was a Thursday).
 *
 * @example
 * isoWeekday(0); // 4
 */
export function isoWeekday(day: number): number {
  return ((((day + 3) % 7) + 7) % 7) + 1;
}
