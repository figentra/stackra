/**
 * Stackra file contract:
 * Purpose: the value of a date-range filter: an inclusive first and last calendar day, either of which may be absent,
 *          so "since 1 March", "until 31 March" and "in March" are one shape.
 * Boundary: types only. Days are `@internationalized/date` `CalendarDate`s, the date type of every date field of the
 *           kit (ADR 0318), so a filter, a DateField and a DatePicker pass values to each other unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318.
 */
import type { CalendarDate } from "@internationalized/date";

/** An inclusive range of calendar days. */
export interface DateRangeValue {
  /** The first day that matches, or `null` for no start. */
  readonly start: CalendarDate | null;
  /** The last day that matches, or `null` for no end. */
  readonly end: CalendarDate | null;
}
