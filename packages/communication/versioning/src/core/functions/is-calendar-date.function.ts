/**
 * Stackra file contract:
 * Purpose: `isCalendarDate`, whether a value is a `YYYY-MM-DD` string that names a real day: the form of a dated
 *          version, of a dated change's `from` and of every change's `sunset`.
 * Boundary: internal: not exported from the entry. The round trip refuses `2027-02-30`, which the pattern alone takes.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (API versions are dates).
 */

/** `YYYY-MM-DD`. */
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whether `value` is a calendar date.
 *
 * @example
 * isCalendarDate("2027-03-01"); // true
 * isCalendarDate("2027-02-30"); // false
 */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !CALENDAR_DATE.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}
