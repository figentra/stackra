/**
 * Stackra file contract:
 * Purpose: `RecurrenceWeekday`, a day of the week as RFC 5545 writes it in `BYDAY` (`MO` to `SU`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29).
 */

/** A weekday as RFC 5545 writes it. */
export type RecurrenceWeekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
