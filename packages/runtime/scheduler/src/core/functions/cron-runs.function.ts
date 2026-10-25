/**
 * Stackra file contract:
 * Purpose: `cronRuns`, every whole minute in `(after, until]` whose wall clock in a time zone matches a parsed cron:
 *          the runs a tick has not pushed yet.
 * Boundary: pure apart from a process-wide cache of one `Intl.DateTimeFormat` per time zone. It steps minute by
 *           minute over real instants, so the caller bounds the range (the scheduler's catch-up window, a day at
 *           most). Across a daylight-saving change a wall time the clocks skip never runs that day, and a wall time
 *           they repeat runs at both instants. `UTC` reads the instant's UTC fields with no formatter.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 5: crons in UTC, schedules in their scope's time zone).
 */
import type { CronFields } from "#core/types/cron-fields.type";

/** One minute in milliseconds. */
const MINUTE = 60_000;

/** One formatter per time zone, made on first use. */
const FORMATS = new Map<string, Intl.DateTimeFormat>();

/** The wall clock of an instant: minute, hour, day of the month, month (1 to 12) and day of the week (0 is Sunday). */
interface WallClock {
  readonly minute: number;
  readonly hour: number;
  readonly day: number;
  readonly month: number;
  readonly weekday: number;
}

/**
 * The wall clock of `instant` in `timeZone`.
 *
 * @throws RangeError when the runtime does not know `timeZone`.
 */
function wallClock(instant: number, timeZone: string): WallClock {
  if (timeZone === "UTC") {
    const date = new Date(instant);
    return {
      minute: date.getUTCMinutes(),
      hour: date.getUTCHours(),
      day: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
      weekday: date.getUTCDay(),
    };
  }
  let format = FORMATS.get(timeZone);
  if (format === undefined) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    FORMATS.set(timeZone, format);
  }
  const parts: Record<string, number> = {};
  for (const part of format.formatToParts(instant))
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  const { year = 1970, month = 1, day = 1, hour = 0, minute = 0 } = parts;
  return {
    minute,
    hour: hour % 24,
    day,
    month,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

/** Whether `wall` matches `fields`; both day fields restricted means either may match (the classic cron rule). */
function matches(fields: CronFields, wall: WallClock): boolean {
  if (
    !fields.minutes.has(wall.minute) ||
    !fields.hours.has(wall.hour) ||
    !fields.months.has(wall.month)
  )
    return false;
  const day = fields.days.has(wall.day);
  const weekday = fields.weekdays.has(wall.weekday);
  return fields.anyDay || fields.anyWeekday ? day && weekday : day || weekday;
}

/**
 * The run instants of `fields` in `timeZone` after `after`, up to and including `until`, oldest first.
 *
 * @throws RangeError when the runtime does not know `timeZone`.
 * @example
 * cronRuns(parseCron("0 * * * *"), "UTC", new Date("2026-10-24T09:30Z"), new Date("2026-10-24T12:00Z"));
 * // [10:00, 11:00, 12:00]
 */
export function cronRuns(
  fields: CronFields,
  timeZone: string,
  after: Date,
  until: Date,
): readonly Date[] {
  const runs: Date[] = [];
  const end = until.getTime();
  for (let at = Math.floor(after.getTime() / MINUTE) * MINUTE + MINUTE; at <= end; at += MINUTE)
    if (matches(fields, wallClock(at, timeZone))) runs.push(new Date(at));
  return runs;
}
