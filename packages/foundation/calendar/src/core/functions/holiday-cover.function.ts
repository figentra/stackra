/**
 * Stackra file contract:
 * Purpose: `holidayCover`, whether one holiday rule covers a day number: as a confirmed holiday, as an uncertain one
 *          (a sighted Hijri rule nobody confirmed for that year), or not at all.
 * Boundary: internal. A yearly rule's occurrence in a year is replaced by any dated rule with the same key in that
 *           year (the Hijri year for a Hijri rule), so a confirmation or a moved holiday is data, never code. A yearly
 *           date the year does not have (29 February, 30 of a 29-day Hijri month) does not occur that year.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 3 and 4).
 */
import { DayStatus } from "#core/enums/day-status.enum";
import { HolidayKind } from "#core/enums/holiday-kind.enum";
import { dateOfDay } from "#core/functions/date-of-day.function";
import { dayNumber } from "#core/functions/day-number.function";
import { gregorianOf } from "#core/functions/gregorian-of.function";
import { hijriAt } from "#core/functions/hijri-at.function";
import type { HolidayRule } from "#core/types/holiday-rule.type";

/** The day number a yearly date starts on, or `undefined` when that year has no such date. */
function startOf(rule: HolidayRule, year: number): number | undefined {
  if (rule.kind === HolidayKind.Dated) return dayNumber(rule.date);
  try {
    return rule.kind === HolidayKind.Gregorian
      ? dayNumber(
          `${String(year).padStart(4, "0")}-${String(rule.month).padStart(2, "0")}-${String(rule.day).padStart(2, "0")}`,
        )
      : dayNumber(gregorianOf({ year, month: rule.month, day: rule.day }));
  } catch (error) {
    if (error instanceof RangeError) return undefined;
    throw error;
  }
}

/** The year a day number is in, in the calendar `kind` counts in. */
function yearOf(kind: HolidayKind, day: number): number {
  return kind === HolidayKind.Hijri ? hijriAt(day).year : Number(dateOfDay(day).slice(0, 4));
}

/**
 * How `rule` covers day number `day`, given every rule of the calendar (for the dated overrides).
 *
 * @example
 * holidayCover({ kind: "dated", key: "closure", date: "2026-01-04", days: 2 }, dayNumber("2026-01-05"), []);
 * // "holiday"
 */
export function holidayCover(
  rule: HolidayRule,
  day: number,
  rules: readonly HolidayRule[],
): typeof DayStatus.Holiday | typeof DayStatus.Uncertain | undefined {
  if (rule.kind === HolidayKind.Dated) {
    const start = dayNumber(rule.date);
    return start <= day && day < start + rule.days ? DayStatus.Holiday : undefined;
  }
  const current = yearOf(rule.kind, day);
  // A span starting late in the previous year can still cover the day.
  for (const year of [current - 1, current]) {
    const start = startOf(rule, year);
    if (start === undefined || day < start || day >= start + rule.days) continue;
    if (rule.since !== undefined && start < dayNumber(rule.since)) continue;
    if (rule.until !== undefined && start > dayNumber(rule.until)) continue;
    const replaced = rules.some(
      (other) =>
        other.kind === HolidayKind.Dated &&
        other.key === rule.key &&
        yearOf(rule.kind, dayNumber(other.date)) === year,
    );
    if (replaced) continue;
    return rule.kind === HolidayKind.Hijri && rule.sighted
      ? DayStatus.Uncertain
      : DayStatus.Holiday;
  }
  return undefined;
}
