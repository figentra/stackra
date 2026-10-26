/**
 * Stackra file contract:
 * Purpose: `periodInstances`, the instances of one period of a rule in order: each matching date times each time of
 *          day from BYHOUR, BYMINUTE and BYSECOND (the series' own time fills a part that is absent), then BYSETPOS.
 * Boundary: internal and pure. An instance is `[day number, seconds after local midnight]`. A BYSETPOS beyond the set
 *           picks nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0387 (BYHOUR, BYMINUTE, BYSECOND, BYSETPOS); RFC 5545 section 3.3.10.
 */
import { rruleMatches } from "#core/functions/rrule-matches.function";
import type { RecurrenceRule } from "#core/types/recurrence-rule.type";

/**
 * The instances of `rule` (started on day `start` at `second` after midnight) between the two days of `period`.
 *
 * @example
 * periodInstances(parseRrule("FREQ=DAILY;BYHOUR=9,17;BYSETPOS=-1"), 0, 32_400, [0, 0]); // [[0, 61_200]]
 */
export function periodInstances(
  rule: RecurrenceRule,
  start: number,
  second: number,
  period: readonly [number, number],
): (readonly [number, number])[] {
  const hours = rule.byHour.length > 0 ? rule.byHour : [Math.floor(second / 3600)];
  const minutes = rule.byMinute.length > 0 ? rule.byMinute : [Math.floor(second / 60) % 60];
  const seconds = rule.bySecond.length > 0 ? rule.bySecond : [second % 60];
  const times = [
    ...new Set(
      hours.flatMap((hour) =>
        minutes.flatMap((minute) => seconds.map((each) => hour * 3600 + minute * 60 + each)),
      ),
    ),
  ].sort((left, right) => left - right);
  const found: (readonly [number, number])[] = [];
  for (let day = period[0]; day <= period[1]; day += 1)
    if (rruleMatches(rule, start, day)) for (const time of times) found.push([day, time]);
  if (rule.bySetPos.length === 0) return found;
  const picked = new Set(
    rule.bySetPos.map((position) => (position > 0 ? position - 1 : found.length + position)),
  );
  return found.filter((_, index) => picked.has(index));
}
