/**
 * Stackra file contract:
 * Purpose: `periodOf`, the window behind `ctx.period(input)`: a named range (`today`, `last_7_days`, `last_30_days`,
 *          `this_month`) or a custom `from` and `to`, with midnights in the call's time zone, its length in days and
 *          the window of the same length before it.
 * Boundary: pure; the pipeline passes its frozen clock reading, so a test pins the window. With no range and no `from`
 *           the window is today.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (metrics over a time range, with the previous period); ADR 0136 (decision 1).
 */
import { startOfZonedDay } from "#core/functions/start-of-zoned-day.function";
import type { Period } from "#core/types/period.type";
import type { PeriodInput } from "#core/types/period-input.type";

const DAY = 86_400_000;

/** Local midnight `days` days after the local midnight `start` (negative goes back). */
function shiftDays(start: Date, days: number, timeZone: string): Date {
  // Noon of the target day is never inside a daylight-saving jump, so its day is the target day.
  return startOfZonedDay(new Date(start.getTime() + days * DAY + DAY / 2), timeZone);
}

/** The window for `input` around `now`, in `timeZone`. */
function windowOf(input: PeriodInput, now: Date, timeZone: string): [from: Date, to: Date] {
  const today = startOfZonedDay(now, timeZone);
  const tomorrow = shiftDays(today, 1, timeZone);
  switch (input.range ?? undefined) {
    case "today":
      return [today, tomorrow];
    case "last_7_days":
      return [shiftDays(today, -6, timeZone), tomorrow];
    case "last_30_days":
      return [shiftDays(today, -29, timeZone), tomorrow];
    case "this_month": {
      const first = startOfZonedDay(now, timeZone, "month");
      return [first, startOfZonedDay(new Date(first.getTime() + 32 * DAY), timeZone, "month")];
    }
    case undefined:
      if (input.from === undefined || input.from === null) return [today, tomorrow];
      return [input.from, input.to ?? now];
    default:
      throw new RangeError(`ctx.period: unknown range ${JSON.stringify(input.range)}`);
  }
}

/**
 * The reporting window `input` names.
 *
 * @throws RangeError for an unknown range code, or a custom `to` that is not after `from`.
 * @example
 * periodOf({ range: "last_7_days" }, ctx.now(), "Asia/Riyadh").days; // 7
 */
export function periodOf(input: PeriodInput, now: Date, timeZone: string): Period {
  const [from, to] = windowOf(input, now, timeZone);
  const length = to.getTime() - from.getTime();
  if (length <= 0)
    throw new RangeError(
      `ctx.period: the end ${to.toISOString()} is not after the start ${from.toISOString()}`,
    );
  return Object.freeze({
    from,
    to,
    days: Math.max(1, Math.round(length / DAY)),
    previous: Object.freeze({ from: new Date(from.getTime() - length), to: from }),
  });
}
