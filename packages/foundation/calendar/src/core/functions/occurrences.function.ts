/**
 * Stackra file contract:
 * Purpose: `occurrences`, the dates and start instants of an RRULE series in its time zone within a window, leaving
 *          out excepted dates and the holidays of a calendar: recurring appointments, weekly sessions, monthly runs.
 * Boundary: pure over its input. The rule is expanded period by period (BYSETPOS picks within a period); instances
 *           before the series start (DTSTART) are neither returned nor counted. An UNTIL with a time ends the series
 *           at that instant (UTC with `Z`, otherwise the series' wall time). Excepted and holiday dates count toward
 *           COUNT unless `countMode` is `kept`. A date that may be an unconfirmed holiday is returned with
 *           `uncertain: true`. Throws a `RangeError` for an unsupported or malformed rule.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 4 and 6) as amended by ADR 0387.
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import { CountMode } from "#core/enums/count-mode.enum";
import { DayStatus } from "#core/enums/day-status.enum";
import { dateOfDay } from "#core/functions/date-of-day.function";
import { dayNumber } from "#core/functions/day-number.function";
import { dayStatus } from "#core/functions/day-status.function";
import { minuteOfDay } from "#core/functions/minute-of-day.function";
import { parseRrule } from "#core/functions/parse-rrule.function";
import { periodInstances } from "#core/functions/period-instances.function";
import { rrulePeriod } from "#core/functions/rrule-period.function";
import { zonedMs } from "#core/functions/zoned-ms.function";
import type { Occurrence } from "#core/types/occurrence.type";
import type { RecurrenceOptions } from "#core/types/recurrence-options.type";

/** The instant of `second` after local midnight of `day` in `timeZone`. */
function instant(day: number, second: number, timeZone: string): number {
  return zonedMs(day, Math.floor(second / 60), timeZone) + (second % 60) * 1000;
}

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
  const first = minuteOfDay(options.time) * 60;
  const untilMs =
    rule.until === undefined || rule.untilTime === undefined
      ? Infinity
      : rule.untilTime.utc
        ? dayNumber(rule.until) * MS_PER_DAY + rule.untilTime.second * 1000
        : instant(dayNumber(rule.until), rule.untilTime.second, options.timeZone);
  const except = new Set((options.except ?? []).map(dayNumber));
  const keptOnly = options.countMode === CountMode.Kept;
  const found: Occurrence[] = [];
  let count = 0;
  for (let index = 0; ; index += 1) {
    const period = rrulePeriod(rule, start, index);
    if (period[0] > last) return found;
    for (const [day, second] of periodInstances(rule, start, first, period)) {
      if (day < start || (day === start && second < first)) continue;
      if (day > last) return found;
      const ms = instant(day, second, options.timeZone);
      if (ms > untilMs) return found;
      // The status is only read where it changes the count or the result.
      const status =
        options.calendar === undefined || (!keptOnly && (day < from || except.has(day)))
          ? undefined
          : dayStatus(options.calendar, dateOfDay(day));
      const dropped = except.has(day) || status === DayStatus.Holiday;
      if (!keptOnly || !dropped) {
        count += 1;
        if (rule.count !== undefined && count > rule.count) return found;
      }
      if (dropped || day < from) continue;
      found.push({
        date: dateOfDay(day),
        start: new Date(ms).toISOString(),
        uncertain: status === DayStatus.Uncertain,
      });
    }
  }
}
