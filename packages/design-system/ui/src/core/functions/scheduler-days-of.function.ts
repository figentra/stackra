/**
 * Stackra file contract:
 * Purpose: `schedulerDaysOf(view, date, locale)`, the days a `Scheduler` view holds: the day, the week from the
 *          locale's first weekday, or every day of the month (month and agenda).
 * Boundary: pure; Gregorian `CalendarDate`s. The month view lays these out with `monthGridOf`.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (gap build, owner approval 2026-10-31).
 */
import { startOfMonth, startOfWeek, type CalendarDate } from "@internationalized/date";

import type { SchedulerView } from "#contracts/enums/scheduler-view.enum";

/**
 * The days of a view.
 * @param view - the view
 * @param date - any day the view holds
 * @param locale - a BCP 47 tag; it decides the first day of the week
 * @returns the days, in order
 */
export function schedulerDaysOf(
  view: SchedulerView,
  date: CalendarDate,
  locale: string,
): CalendarDate[] {
  if (view === "day") return [date];
  if (view === "week") {
    const first = startOfWeek(date, locale);
    return Array.from({ length: 7 }, (_, i) => first.add({ days: i }));
  }
  const first = startOfMonth(date);
  return Array.from({ length: first.calendar.getDaysInMonth(first) }, (_, i) =>
    first.add({ days: i }),
  );
}
