/**
 * Stackra file contract:
 * Purpose: `weekdayNameOf(day, locale)`, an RFC 5545 weekday's full name in the locale, from Intl.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; ADR 0403; STA-1371.
 */
import type { RecurrenceWeekday } from "#contracts/types/recurrence-weekday.type";
import { RECURRENCE_WEEKDAYS } from "#core/constants/recurrence-weekdays.constant";

/** A Monday: 1 January 2024. Weekday names are read off the days after it. */
const MONDAY = Date.UTC(2024, 0, 1);

/**
 * The weekday's name in `locale`.
 * @param day - the RFC 5545 weekday
 * @param locale - a BCP 47 tag
 * @returns "Sunday", "الأحد", …
 */
export function weekdayNameOf(day: RecurrenceWeekday, locale: string): string {
  const index = RECURRENCE_WEEKDAYS.indexOf(day);
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    MONDAY + index * 86_400_000,
  );
}
