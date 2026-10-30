/**
 * Stackra file contract:
 * Purpose: `RECURRENCE_WEEKDAYS`, the RFC 5545 weekdays in ISO order (Monday first), the index matching
 *          `@internationalized/date`'s day-of-week counted from Monday.
 * Boundary: data only; the editors reorder them to the locale's first day for display.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; STA-1371.
 */
import type { RecurrenceWeekday } from "#contracts/types/recurrence-weekday.type";

/** Monday to Sunday. */
export const RECURRENCE_WEEKDAYS: readonly RecurrenceWeekday[] = Object.freeze([
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
  "SU",
]);
