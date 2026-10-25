/**
 * Stackra file contract:
 * Purpose: `rruleMatches`, whether a day number is a date of a parsed rule that started on another day number.
 * Boundary: internal. The interval is counted in the rule's frequency from the start (weeks from WKST). When no BY part
 *           fixes the day, the start supplies it: its weekday (WEEKLY), its day of month (MONTHLY), its month and day
 *           (YEARLY), as RFC 5545 does.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 6).
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import { isoWeekday } from "#core/functions/iso-weekday.function";
import type { RecurrenceRule } from "#core/types/recurrence-rule.type";

/**
 * `true` when day number `day` is a date of `rule` started on day number `start`.
 *
 * @example
 * rruleMatches(parseRrule("FREQ=WEEKLY;INTERVAL=2"), 0, 14); // true
 */
export function rruleMatches(rule: RecurrenceRule, start: number, day: number): boolean {
  const at = new Date(day * MS_PER_DAY);
  const first = new Date(start * MS_PER_DAY);
  const year = at.getUTCFullYear();
  const month = at.getUTCMonth() + 1;
  const date = at.getUTCDate();
  const weekday = isoWeekday(day);
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weekOf = (value: number): number => value - ((isoWeekday(value) - rule.weekStart + 7) % 7);
  const period =
    rule.freq === "DAILY"
      ? day - start
      : rule.freq === "WEEKLY"
        ? (weekOf(day) - weekOf(start)) / 7
        : rule.freq === "MONTHLY"
          ? (year - first.getUTCFullYear()) * 12 + month - 1 - first.getUTCMonth()
          : year - first.getUTCFullYear();
  if (period % rule.interval !== 0) return false;
  if (rule.byMonth.length > 0 && !rule.byMonth.includes(month)) return false;
  if (
    rule.byMonthDay.length > 0 &&
    !rule.byMonthDay.some((value) => (value > 0 ? value === date : length + value + 1 === date))
  )
    return false;
  if (rule.byDay.length > 0)
    return rule.byDay.some(
      (entry) =>
        entry.weekday === weekday &&
        (entry.nth === undefined ||
          (entry.nth > 0
            ? Math.ceil(date / 7) === entry.nth
            : Math.ceil((length - date + 1) / 7) === -entry.nth)),
    );
  if (rule.byMonthDay.length > 0 || rule.freq === "DAILY") return true;
  if (rule.freq === "WEEKLY") return weekday === isoWeekday(start);
  if (rule.freq === "MONTHLY") return date === first.getUTCDate();
  return (
    date === first.getUTCDate() && (rule.byMonth.length > 0 || month === first.getUTCMonth() + 1)
  );
}
