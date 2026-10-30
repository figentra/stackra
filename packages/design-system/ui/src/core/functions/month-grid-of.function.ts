/**
 * Stackra file contract:
 * Purpose: `monthGridOf(month, locale)`, the weeks of a month as rows of seven days starting on the locale's first
 *          day of the week, with `null` for the cells before the first and after the last day.
 * Boundary: pure; Gregorian `CalendarDate`s.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import { getDayOfWeek, startOfMonth, type CalendarDate } from "@internationalized/date";

/**
 * The weeks of a month.
 * @param month - any day of the month
 * @param locale - a BCP 47 tag; it decides the first day of the week
 * @returns rows of seven cells
 */
export function monthGridOf(month: CalendarDate, locale: string): (CalendarDate | null)[][] {
  const first = startOfMonth(month);
  const lead = getDayOfWeek(first, locale);
  const days = first.calendar.getDaysInMonth(first);
  const cells: (CalendarDate | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => first.add({ days: i })),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}
