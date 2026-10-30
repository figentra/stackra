/**
 * Stackra file contract:
 * Purpose: `RecurrenceRule`, the parts of an RFC 5545 `RRULE` the RecurrenceEditor writes: how often, every how many,
 *          on which weekdays, which day of the month (or which nth weekday), in which month, when it ends, and the
 *          calendar it counts months in (RFC 7529 `RSCALE`, so "every month on the 1st" can mean the Hijri 1st).
 * Boundary: types only; `rruleOf` writes it as text and `parseRrule` reads it back.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529 (RSCALE); ADR 0302 (decision 3); STA-1371.
 */
import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import type { RecurrenceWeekday } from "#contracts/types/recurrence-weekday.type";

/** One repeating rule. */
export interface RecurrenceRule {
  /** `FREQ`: the unit it repeats in. */
  readonly frequency: "daily" | "weekly" | "monthly" | "yearly";
  /** `INTERVAL`: every how many units; 1 when left out. */
  readonly interval?: number | undefined;
  /** `BYDAY`: the weekdays of a weekly rule, or the one weekday of a monthly rule with `nth`. */
  readonly weekdays?: readonly RecurrenceWeekday[] | undefined;
  /** With one weekday on a monthly or yearly rule: which one of the month, 1 to 4, or -1 for the last. */
  readonly nth?: number | undefined;
  /** `BYMONTHDAY`: the day of the month, 1 to 31, or -1 for the last day. */
  readonly monthDay?: number | undefined;
  /** `BYMONTH`: the month of a yearly rule, 1 to 12, in `calendar`. */
  readonly month?: number | undefined;
  /** `COUNT`: how many times in all; the rule never ends when neither this nor `until` is set. */
  readonly count?: number | undefined;
  /** `UNTIL`: the last day it may fall on, a Gregorian ISO date (`2026-12-31`). */
  readonly until?: string | undefined;
  /** `RSCALE`: the calendar months and month days count in. Gregorian when left out. */
  readonly calendar?: CalendarSystem | undefined;
}
