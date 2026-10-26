/**
 * Stackra file contract:
 * Purpose: `rruleMatches`, whether a day number is a date of a parsed rule that started on another day number.
 * Boundary: internal. The interval is counted in the rule's frequency from the start (weeks from WKST). BYMONTH,
 *           BYWEEKNO, BYYEARDAY, BYMONTHDAY and BYDAY each narrow the dates; a BYDAY position counts in the month, or
 *           in the year for a YEARLY rule without BYMONTH. When no BY part fixes the day, the start supplies it: its
 *           weekday (WEEKLY), its day of month (MONTHLY), its month and day (YEARLY), as RFC 5545 does. Times and
 *           BYSETPOS are applied per period by `periodInstances`.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 6) as amended by ADR 0387.
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import { isoWeekday } from "#core/functions/iso-weekday.function";
import { weekNumber } from "#core/functions/week-number.function";
import type { RecurrenceRule } from "#core/types/recurrence-rule.type";

/** `true` when `position` of `span` is the signed `value` (`-1` the last). */
function at(value: number, position: number, span: number): boolean {
  return value > 0 ? value === position : span + value + 1 === position;
}

/**
 * `true` when day number `day` is a date of `rule` started on day number `start`.
 *
 * @example
 * rruleMatches(parseRrule("FREQ=WEEKLY;INTERVAL=2"), 0, 14); // true
 */
export function rruleMatches(rule: RecurrenceRule, start: number, day: number): boolean {
  const date = new Date(day * MS_PER_DAY);
  const first = new Date(start * MS_PER_DAY);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const monthDay = date.getUTCDate();
  const weekday = isoWeekday(day);
  const monthLength = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const yearStart = Date.UTC(year, 0, 1) / MS_PER_DAY;
  const yearLength = Date.UTC(year + 1, 0, 1) / MS_PER_DAY - yearStart;
  const yearDay = day - yearStart + 1;
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
  if (rule.byWeekNo.length > 0) {
    const { week, weeks } = weekNumber(day, rule.weekStart);
    if (!rule.byWeekNo.some((value) => at(value, week, weeks))) return false;
  }
  if (rule.byYearDay.length > 0 && !rule.byYearDay.some((value) => at(value, yearDay, yearLength)))
    return false;
  if (
    rule.byMonthDay.length > 0 &&
    !rule.byMonthDay.some((value) => at(value, monthDay, monthLength))
  )
    return false;
  if (rule.byDay.length > 0) {
    const inYear = rule.freq === "YEARLY" && rule.byMonth.length === 0;
    const [position, span] = inYear ? [yearDay, yearLength] : [monthDay, monthLength];
    return rule.byDay.some(
      (entry) =>
        entry.weekday === weekday &&
        (entry.nth === undefined ||
          (entry.nth > 0
            ? Math.ceil(position / 7) === entry.nth
            : Math.ceil((span - position + 1) / 7) === -entry.nth)),
    );
  }
  if (
    rule.byMonthDay.length > 0 ||
    rule.byYearDay.length > 0 ||
    rule.byWeekNo.length > 0 ||
    rule.freq === "DAILY"
  )
    return true;
  if (rule.freq === "WEEKLY") return weekday === isoWeekday(start);
  if (rule.freq === "MONTHLY") return monthDay === first.getUTCDate();
  return (
    monthDay === first.getUTCDate() &&
    (rule.byMonth.length > 0 || month === first.getUTCMonth() + 1)
  );
}
