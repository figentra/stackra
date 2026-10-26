/**
 * Stackra file contract:
 * Purpose: `rrulePeriod`, the first and last day numbers of the n-th period of a rule: the day, the week from WKST,
 *          the calendar month or the calendar year that holds the start, stepped by INTERVAL.
 * Boundary: internal and pure; BYSETPOS picks positions within one period.
 * Runtime: isomorphic
 * Governing contract: ADR 0387 (BYSETPOS and per-period expansion); RFC 5545 section 3.3.10.
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import { isoWeekday } from "#core/functions/iso-weekday.function";
import type { RecurrenceRule } from "#core/types/recurrence-rule.type";

/**
 * Period `index` (0 holds `start`) of `rule`, both ends included.
 *
 * @example
 * rrulePeriod(parseRrule("FREQ=MONTHLY"), dayNumber("2026-01-04"), 1); // February 2026
 */
export function rrulePeriod(
  rule: RecurrenceRule,
  start: number,
  index: number,
): readonly [number, number] {
  const step = index * rule.interval;
  if (rule.freq === "DAILY") return [start + step, start + step];
  if (rule.freq === "WEEKLY") {
    const first = start - ((isoWeekday(start) - rule.weekStart + 7) % 7) + 7 * step;
    return [first, first + 6];
  }
  const date = new Date(start * MS_PER_DAY);
  const year = date.getUTCFullYear();
  if (rule.freq === "MONTHLY") {
    const month = date.getUTCMonth() + step;
    return [Date.UTC(year, month, 1) / MS_PER_DAY, Date.UTC(year, month + 1, 0) / MS_PER_DAY];
  }
  return [Date.UTC(year + step, 0, 1) / MS_PER_DAY, Date.UTC(year + step + 1, 0, 0) / MS_PER_DAY];
}
