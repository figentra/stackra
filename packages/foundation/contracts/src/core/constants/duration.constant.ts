/**
 * Stackra file contract:
 * Purpose: `Duration`, a length of time as a canonical ISO 8601 duration string (`PT10M`), with the constructors gen
 *          evaluates in defaults (`Duration.minutes(10)`) and the reads a driver needs (`toMilliseconds`).
 * Boundary: a frozen namespace object plus the type of the same name. The value is the string itself, so it is JSON,
 *           a config value and a wire value as it is, and two equal lengths are `===`. Only fixed lengths exist: days,
 *           hours, minutes and seconds (years and months vary, so they are refused). Precision is one millisecond.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: `Duration.*` is a constant gen evaluates), ADR 0127 2026-10-24 note (the
 *                     leaf vocabulary).
 */
import type { Branded } from "#core/types/branded.type";

/** A length of time: a canonical ISO 8601 duration, made only by `Duration.*`. */
export type Duration = Branded<`P${string}`, "Duration">;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** `PnW`, then `PnD` and `T` with `nH`, `nM`, `nS`; each number may have a decimal fraction. */
const ISO_DURATION =
  /^P(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

/** Milliseconds of an ISO 8601 duration, or `undefined` when it is not one this type accepts. */
function millisecondsOf(text: string): number | undefined {
  const match = ISO_DURATION.exec(text);
  if (match === null || text === "P" || text.endsWith("T")) return undefined;
  const [, weeks, days, hours, minutes, seconds] = match;
  const parts: readonly [string | undefined, number][] = [
    [weeks, WEEK],
    [days, DAY],
    [hours, HOUR],
    [minutes, MINUTE],
    [seconds, SECOND],
  ];
  return Math.round(parts.reduce((sum, [amount, unit]) => sum + Number(amount ?? 0) * unit, 0));
}

/** The canonical form: whole days, then hours, minutes and seconds with a millisecond fraction; zero is `PT0S`. */
function fromMilliseconds(milliseconds: number): Duration {
  if (!Number.isFinite(milliseconds) || milliseconds < 0)
    throw new RangeError(
      `A duration is a finite length of zero or more, not ${String(milliseconds)}`,
    );
  let rest = Math.round(milliseconds);
  const days = Math.floor(rest / DAY);
  rest -= days * DAY;
  const hours = Math.floor(rest / HOUR);
  rest -= hours * HOUR;
  const minutes = Math.floor(rest / MINUTE);
  rest -= minutes * MINUTE;
  const time = `${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${rest ? `${rest / SECOND}S` : ""}`;
  if (days === 0 && time === "") return "PT0S" as Duration;
  return `P${days ? `${days}D` : ""}${time ? `T${time}` : ""}` as Duration;
}

/**
 * Builds and reads durations.
 *
 * @example
 * override refreshEvery = Duration.seconds(60); // "PT1M"
 * Duration.toMilliseconds(Duration.minutes(10)); // 600000
 */
export const Duration = Object.freeze({
  /**
   * `amount` seconds; a fraction keeps whole milliseconds.
   * @throws RangeError when `amount` is negative or not finite.
   */
  seconds: (amount: number): Duration => fromMilliseconds(amount * SECOND),

  /**
   * `amount` minutes.
   * @throws RangeError when `amount` is negative or not finite.
   */
  minutes: (amount: number): Duration => fromMilliseconds(amount * MINUTE),

  /**
   * `amount` hours.
   * @throws RangeError when `amount` is negative or not finite.
   */
  hours: (amount: number): Duration => fromMilliseconds(amount * HOUR),

  /**
   * `amount` days of exactly 24 hours.
   * @throws RangeError when `amount` is negative or not finite.
   */
  days: (amount: number): Duration => fromMilliseconds(amount * DAY),

  /**
   * Reads an ISO 8601 duration from outside (an environment value, a wire value) into its canonical form, so
   * `Duration.parse("PT600S") === Duration.minutes(10)`. Weeks are read as seven days.
   * @throws RangeError when `text` is not a duration of weeks, days, hours, minutes and seconds.
   */
  parse(text: string): Duration {
    const milliseconds = millisecondsOf(text);
    if (milliseconds === undefined)
      throw new RangeError(
        `"${text}" is not an ISO 8601 duration of days, hours, minutes and seconds`,
      );
    return fromMilliseconds(milliseconds);
  },

  /** The length in milliseconds, for a timer, a TTL or a lock. */
  toMilliseconds(duration: Duration): number {
    return millisecondsOf(duration) ?? Number.NaN;
  },
});
