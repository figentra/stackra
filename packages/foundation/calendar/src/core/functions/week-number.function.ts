/**
 * Stackra file contract:
 * Purpose: `weekNumber`, the RFC 5545 week number of a day number for BYWEEKNO: weeks start on WKST and week 1 is the
 *          first week with at least four days in the year, so a day near New Year may belong to the next or the
 *          previous year's weeks. Also gives how many weeks that week-year has, for negative week numbers.
 * Boundary: internal and pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0387 (BYWEEKNO); RFC 5545 section 3.3.10.
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import { isoWeekday } from "#core/functions/iso-weekday.function";

/**
 * The week of `day` and the weeks in its week-year, with weeks starting on ISO weekday `weekStart`.
 *
 * @example
 * weekNumber(dayNumber("2026-01-01"), 1); // { week: 1, weeks: 53 }
 */
export function weekNumber(day: number, weekStart: number): { week: number; weeks: number } {
  const startOf = (value: number): number => value - ((isoWeekday(value) - weekStart + 7) % 7);
  // Week 1 is the week holding 4 January; a week belongs to the year its fourth day is in.
  const firstWeek = (year: number): number => startOf(Date.UTC(year, 0, 4) / MS_PER_DAY);
  const begins = startOf(day);
  const year = new Date((begins + 3) * MS_PER_DAY).getUTCFullYear();
  return {
    week: (begins - firstWeek(year)) / 7 + 1,
    weeks: (firstWeek(year + 1) - firstWeek(year)) / 7,
  };
}
