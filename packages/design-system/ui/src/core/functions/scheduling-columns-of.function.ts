/**
 * Stackra file contract:
 * Purpose: `schedulingColumnsOf(view, date, options)`, the columns a SchedulingBoard view holds: the slots of the day,
 *          the slots of each day of the week from the locale's first weekday (both within the hours shown), or one
 *          column per day of the timeline.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { CalendarDate } from "@internationalized/date";

import type { SchedulingBoardView } from "#contracts/enums/scheduling-board-view.enum";
import { schedulerDaysOf } from "#core/functions/scheduler-days-of.function";
import type { SchedulingColumn } from "#core/types/scheduling-column.type";
import type { SchedulingColumnOptions } from "#core/types/scheduling-column-options.type";

/** A minute in milliseconds. */
const MINUTE = 60_000;

/**
 * The columns of a view.
 * @param view - the view
 * @param date - the day the view holds
 * @param options - the time zone, slot, hours, timeline length and locale
 * @returns the columns, earliest first
 * @example
 * schedulingColumnsOf("day", today, { timeZone: "Asia/Riyadh", slotMinutes: 30, startHour: 8, endHour: 20,
 *   timelineDays: 14, locale: "ar-SA" }).length; // 24
 */
export function schedulingColumnsOf(
  view: SchedulingBoardView,
  date: CalendarDate,
  options: SchedulingColumnOptions,
): SchedulingColumn[] {
  const { timeZone, slotMinutes, startHour, endHour, timelineDays, locale } = options;
  if (view === "timeline") {
    return Array.from({ length: timelineDays }, (_, index) => {
      const day = date.add({ days: index });
      return {
        start: day.toDate(timeZone),
        end: day.add({ days: 1 }).toDate(timeZone),
        day,
        opensDay: true,
      };
    });
  }
  const days = view === "day" ? [date] : schedulerDaysOf("week", date, locale);
  const step = slotMinutes * MINUTE;
  const perDay = Math.floor(((endHour - startHour) * 60) / slotMinutes);
  return days.flatMap((day) => {
    // shortcut: minutes count from local midnight, as dayLayoutOf; a daylight-saving day is off by its shift.
    const from = day.toDate(timeZone).getTime() + startHour * 60 * MINUTE;
    return Array.from({ length: perDay }, (_, index) => ({
      start: new Date(from + index * step),
      end: new Date(from + (index + 1) * step),
      day,
      opensDay: index === 0,
    }));
  });
}
