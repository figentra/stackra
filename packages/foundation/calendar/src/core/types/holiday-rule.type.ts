/**
 * Stackra file contract:
 * Purpose: `HolidayRule`, one entry of a holiday set: a dated span, a yearly Gregorian date or a yearly Umm al-Qura
 *          date, each with a key and a length in days.
 * Boundary: a type only, derived from `BusinessCalendar`. A dated rule with the same key as a yearly rule replaces that
 *           rule's occurrence in the same year (Hijri year for a Hijri rule), which is how a moved or confirmed
 *           holiday is recorded.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 3 and 4).
 */
import type { BusinessCalendar } from "#core/types/business-calendar.type";

/** One holiday rule. */
export type HolidayRule = BusinessCalendar["holidays"][number];
