/**
 * Stackra file contract:
 * Purpose: `MS_PER_DAY`, the milliseconds in one UTC day, the unit of the day numbers every calculation here uses.
 * Boundary: internal; not exported from the entry. A day number is whole days since 1970-01-01 in UTC, so it never
 *           depends on a time zone or a clock change.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 2: dates are ISO Gregorian, arithmetic on day numbers).
 */

/** Milliseconds in one UTC day. */
export const MS_PER_DAY = 86_400_000;
