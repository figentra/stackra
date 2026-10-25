/**
 * Stackra file contract:
 * Purpose: `occurrences`, the dates and start instants of an RRULE series in its time zone within a window, leaving
 *          out excepted dates and the holidays of a calendar: recurring appointments, weekly sessions, monthly runs.
 * Boundary: pure over its input. Excepted and holiday dates still count toward COUNT (as EXDATE does in RFC 5545);
 *           a date that may be an unconfirmed holiday is returned with `uncertain: true`. Throws a `RangeError` for an
 *           unsupported or malformed rule.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 4 and 6).
 */
import { DayStatus } from "#core/enums/day-status.enum";
import { dateOfDay } from "#core/functions/date-of-day.function";
import { dayNumber } from "#core/functions/day-number.function";
import { dayStatus } from "#core/functions/day-status.function";
import { minuteOfDay } from "#core/functions/minute-of-day.function";
import { parseRrule } from "#core/functions/parse-rrule.function";
import { rruleMatches } from "#core/functions/rrule-matches.function";
import { zonedMs } from "#core/functions/zoned-ms.function";
import type { Occurrence } from "#core/types/occurrence.type";
import type { RecurrenceOptions } from "#core/types/recurrence-options.type";

/**
 * The occurrences of a series within `[from, to]`.
 *
 * @example
 * occurrences({ rule: "FREQ=WEEKLY;COUNT=3", start: "2026-01-04", time: "10:00", timeZone: "Asia/Riyadh", to: "2026-12-31" });
 * // 2026-01-04, 2026-01-11 and 2026-01-18 at 07:00Z
 */
export function occurrences(options: RecurrenceOptions): Occurrence[] {
  const rule = parseRrule(options.rule);
  const start = dayNumber(options.start);
  const from = options.from === undefined ? start : dayNumber(options.from);
  const last = Math.min(
    dayNumber(options.to),
    rule.until === undefined ? Infinity : dayNumber(rule.until),
  );
  const minute = minuteOfDay(options.time);
  const except = new Set((options.except ?? []).map(dayNumber));
  const found: Occurrence[] = [];
  let count = 0;
  for (let day = start; day <= last; day += 1) {
    if (!rruleMatches(rule, start, day)) continue;
    count += 1;
    if (rule.count !== undefined && count > rule.count) break;
    if (day < from || except.has(day)) continue;
    const date = dateOfDay(day);
    const status = options.calendar === undefined ? undefined : dayStatus(options.calendar, date);
    if (status === DayStatus.Holiday) continue;
    found.push({
      date,
      start: new Date(zonedMs(day, minute, options.timeZone)).toISOString(),
      uncertain: status === DayStatus.Uncertain,
    });
  }
  return found;
}
