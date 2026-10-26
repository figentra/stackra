/**
 * Stackra file contract:
 * Purpose: the two conversions between a `CalendarDate` (a day with no time and no zone, what the field holds) and the
 *          platform's `Date` (what the native picker takes and returns): a day becomes local noon, and a `Date` becomes
 *          the day it falls on in local time. Noon keeps a day whole across a daylight-saving shift and any zone the
 *          picker might apply, so the day never moves (ADR 0318).
 * Boundary: pure; no React, no React Native. Shared by the native DateField and DatePicker.
 * Runtime: react-native
 * Governing contract: ADR 0318 (decision 8); FR-206 of STA-350.
 */
import type { CalendarDate } from "@internationalized/date";

/** The platform `Date` for a day: local noon of that day. */
export function toPlatformDate(day: CalendarDate): Date {
  const date = new Date(2000, 0, 1, 12);
  // `setFullYear`, not the constructor, which reads a year below 100 as 19xx.
  date.setFullYear(day.year, day.month - 1, day.day);
  return date;
}
