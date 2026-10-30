/**
 * Stackra file contract:
 * Purpose: `calendarWeeksOf`, the weeks of a calendar heatmap from `start` to `end`: one column of seven days per
 *          week, the first day being `weekStart` (0 Sunday to 6 Saturday), padded so every column is whole.
 * Boundary: pure; dates are calendar days in UTC, so a time zone never shifts a value to its neighbour.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { CalendarDay } from "#core/types/calendar-day.type";

/** One day in milliseconds. */
const DAY = 86_400_000;

/** A date's UTC midnight. */
const dayOf = (date: string): number => Date.parse(`${date.slice(0, 10)}T00:00:00Z`);

/**
 * The weeks from `start` to `end` (ISO dates), each a column of seven days.
 * @example calendarWeeksOf([{ date: "2026-10-01", value: 2 }], "2026-10-01", "2026-10-01", 0)[0]?.[4]; // { date: "2026-10-01", value: 2, isInRange: true }
 */
export function calendarWeeksOf(
  values: readonly { readonly date: string; readonly value: number }[],
  start: string,
  end: string,
  weekStart: number,
): CalendarDay[][] {
  const byDay = new Map<string, number>();
  for (const item of values)
    byDay.set(item.date.slice(0, 10), (byDay.get(item.date.slice(0, 10)) ?? 0) + item.value);
  const first = dayOf(start);
  const last = dayOf(end);
  const lead = (new Date(first).getUTCDay() - weekStart + 7) % 7;
  const weeks: CalendarDay[][] = [];
  for (let at = first - lead * DAY; at <= last; at += 7 * DAY)
    weeks.push(
      Array.from({ length: 7 }, (_, offset) => {
        const time = at + offset * DAY;
        const date = new Date(time).toISOString().slice(0, 10);
        return { date, value: byDay.get(date) ?? null, isInRange: time >= first && time <= last };
      }),
    );
  return weeks;
}
