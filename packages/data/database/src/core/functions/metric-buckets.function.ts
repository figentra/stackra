/**
 * Stackra file contract:
 * Purpose: `metricBuckets`, the keys of the buckets a window `[from, to)` touches at a grain in a time zone, oldest
 *          first, in the form the metrics reader's SQL writes them (`to_char(date_trunc(grain, at at time zone tz),
 *          'YYYY-MM-DD HH24:MI')`), so a row's bucket finds its index.
 * Boundary: pure, on the platform's `Intl.DateTimeFormat`. It steps the local wall clock, never elapsed time, so a
 *           daylight-saving change neither splits nor merges a day; the repeated hour of a fall-back change is one
 *           hour bucket, as Postgres buckets it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 16); ADR 0136 (decision 1); reporting gap 10.
 */
import { MetricGrain } from "#core/enums/metric-grain.enum";

/** The most buckets one series may hold, so an hourly series over years is refused, not drawn. */
const MAX_BUCKETS = 5000;

/** The wall clock of `instant` in `timeZone`, as the UTC instant with the same fields. */
function wallClock(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const field = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(field("year"), field("month") - 1, field("day"), field("hour"), field("minute"));
}

/** The start of the bucket wall clock `time` falls in. */
function truncate(time: number, grain: MetricGrain): number {
  const at = new Date(time);
  const [year, month, day] = [at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()];
  switch (grain) {
    case MetricGrain.Hour: {
      return Date.UTC(year, month, day, at.getUTCHours());
    }
    case MetricGrain.Week: {
      return Date.UTC(year, month, day - ((at.getUTCDay() + 6) % 7));
    }
    case MetricGrain.Month: {
      return Date.UTC(year, month, 1);
    }
    case MetricGrain.Quarter: {
      return Date.UTC(year, month - (month % 3), 1);
    }
    default: {
      return Date.UTC(year, month, day);
    }
  }
}

/** The start of the bucket after the one starting at `start`. */
function next(start: number, grain: MetricGrain): number {
  const at = new Date(start);
  const [year, month, day] = [at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()];
  switch (grain) {
    case MetricGrain.Hour: {
      return start + 3_600_000;
    }
    case MetricGrain.Week: {
      return Date.UTC(year, month, day + 7);
    }
    case MetricGrain.Month: {
      return Date.UTC(year, month + 1, 1);
    }
    case MetricGrain.Quarter: {
      return Date.UTC(year, month + 3, 1);
    }
    default: {
      return Date.UTC(year, month, day + 1);
    }
  }
}

/**
 * The bucket keys of `[from, to)`.
 *
 * @throws RangeError when `timeZone` is not an IANA time zone, or the window holds more than 5,000 buckets.
 * @example
 * metricBuckets(new Date("2026-10-24T21:00:00Z"), new Date("2026-10-26T21:00:00Z"), MetricGrain.Day, "Asia/Riyadh");
 * // ["2026-10-25 00:00", "2026-10-26 00:00"]
 */
export function metricBuckets(
  from: Date,
  to: Date,
  grain: MetricGrain,
  timeZone: string,
): string[] {
  const end = wallClock(to, timeZone);
  const keys: string[] = [];
  for (
    let start = truncate(wallClock(from, timeZone), grain);
    start < end;
    start = next(start, grain)
  ) {
    if (keys.length === MAX_BUCKETS)
      throw new RangeError(`a metrics series holds at most ${MAX_BUCKETS} buckets of a ${grain}`);
    keys.push(new Date(start).toISOString().slice(0, 16).replace("T", " "));
  }
  return keys;
}
