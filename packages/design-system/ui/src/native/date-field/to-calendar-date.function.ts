/**
 * Stackra file contract:
 * Purpose: `toCalendarDate`: the day a platform `Date` falls on, in local time.
 * Boundary: a pure function; no state, no I/O.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0318 (decision 8); FR-206 of STA-350.
 */
import { CalendarDate } from "@internationalized/date";

/** The day a platform `Date` falls on, in local time. */
export const toCalendarDate = (date: Date): CalendarDate =>
  new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
