/**
 * Stackra file contract:
 * Purpose: the `time` helpers: fixed-length shifts of an instant (seconds, minutes, hours, UTC days) and calendar-month
 *          shifts on the UTC calendar with the day clamped to the month's end, each returning a new `Date` and never
 *          mutating its input, so callers compute cutoffs such as `time.subMinutes(ctx.now(), 30)` and billing
 *          periods such as `time.addMonths(anchor, n)` without hand arithmetic.
 * Boundary: pure; no clock read, no host time zone or locale, no dependency. The current time comes from the caller
 *           (the `Clock` port of @stackra/contracts or the action context).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15, entries; rule R7, functions); ADR 0305 (one declaration per file);
 *                     ADR 0127 2026-10-24 note (support in foundation, entry `.`).
 */

const MS_PER_SECOND = 1_000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Returns a new `Date` `amount × unitMs` milliseconds after `date`.
 *
 * @throws RangeError when `date` is an invalid `Date` or `amount` is not a finite number, so an `Invalid Date`
 *   never travels on into a query or a comparison.
 */
const shift = (date: Date, amount: number, unitMs: number): Date => {
  const start = date.getTime();
  if (Number.isNaN(start)) throw new RangeError("time: the date is invalid");
  if (!Number.isFinite(amount))
    throw new RangeError(`time: the amount must be finite, got ${amount}`);
  return new Date(start + amount * unitMs);
};

/**
 * Returns a new `Date` `amount` calendar months after `date` on the UTC calendar, keeping the UTC time of day and
 * clamping the day to the last day of the target month (31 January plus one month is 28 or 29 February).
 *
 * @throws RangeError when `date` is invalid or `amount` is not a safe integer.
 */
const shiftMonths = (date: Date, amount: number): Date => {
  if (Number.isNaN(date.getTime())) throw new RangeError("time: the date is invalid");
  if (!Number.isSafeInteger(amount))
    throw new RangeError(`time: a month amount must be a whole number, got ${amount}`);
  const month = date.getUTCMonth() + amount;
  // Day 0 of the month after the target is the target's last day.
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), month + 1, 0)).getUTCDate();
  const result = new Date(date);
  result.setUTCFullYear(date.getUTCFullYear(), month, Math.min(date.getUTCDate(), lastDay));
  return result;
};

/**
 * Fixed-length time arithmetic over instants. Every helper takes a `Date` and an amount, returns a new `Date` and
 * leaves the input untouched. A negative amount shifts the other way; a fractional amount is allowed and the result
 * is truncated to whole milliseconds by `Date`.
 *
 * Units are exact lengths on the UTC timeline: a minute is 60 s, an hour 3,600 s and a day 86,400 s. A `Date` is a
 * UTC instant, so `addDays` moves the UTC calendar date by whole days; across a daylight-saving change in some zone
 * the local wall-clock hour shifts by the offset change, which is the intended behaviour for cutoffs and expiries.
 * Calendar months (`addMonths`, `subMonths`) move the UTC calendar date and clamp the day to the target month's last
 * day. Shift from a fixed anchor (`addMonths(anchor, n)` for the n-th period), never from the previous result: chained
 * shifts drift (31 Jan, 28 Feb, 28 Mar). A period that starts on a wall-clock date in a zone passes that date as UTC
 * midnight and reads the result the same way. Years are `addMonths(date, 12 * years)`.
 *
 * Named in camelCase, not SCREAMING_SNAKE, because it is a namespace of functions that consumers call as
 * `time.subMinutes(...)` (the template contract), not a constant value.
 *
 * Every helper throws a `RangeError` when the date is invalid or the amount is not finite.
 *
 * @example
 * ```ts
 * import { time } from "@stackra/support";
 *
 * const cutoff = time.subMinutes(ctx.now(), settings.autoCancelAfterMinutes);
 * const expiresAt = time.addDays(issuedAt, 30);
 * ```
 */
export const time = Object.freeze({
  /**
   * `date` plus `amount` seconds.
   * @param date - the instant to start from; not mutated.
   * @param amount - seconds to add; negative subtracts.
   * @returns a new `Date`.
   */
  addSeconds: (date: Date, amount: number): Date => shift(date, amount, MS_PER_SECOND),

  /**
   * `date` minus `amount` seconds.
   * @param date - the instant to start from; not mutated.
   * @param amount - seconds to subtract; negative adds.
   * @returns a new `Date`.
   */
  subSeconds: (date: Date, amount: number): Date => shift(date, -amount, MS_PER_SECOND),

  /**
   * `date` plus `amount` minutes.
   * @param date - the instant to start from; not mutated.
   * @param amount - minutes to add; negative subtracts.
   * @returns a new `Date`.
   */
  addMinutes: (date: Date, amount: number): Date => shift(date, amount, MS_PER_MINUTE),

  /**
   * `date` minus `amount` minutes.
   * @param date - the instant to start from; not mutated.
   * @param amount - minutes to subtract; negative adds.
   * @returns a new `Date`.
   */
  subMinutes: (date: Date, amount: number): Date => shift(date, -amount, MS_PER_MINUTE),

  /**
   * `date` plus `amount` hours.
   * @param date - the instant to start from; not mutated.
   * @param amount - hours to add; negative subtracts.
   * @returns a new `Date`.
   */
  addHours: (date: Date, amount: number): Date => shift(date, amount, MS_PER_HOUR),

  /**
   * `date` minus `amount` hours.
   * @param date - the instant to start from; not mutated.
   * @param amount - hours to subtract; negative adds.
   * @returns a new `Date`.
   */
  subHours: (date: Date, amount: number): Date => shift(date, -amount, MS_PER_HOUR),

  /**
   * `date` plus `amount` UTC days of exactly 24 hours.
   * @param date - the instant to start from; not mutated.
   * @param amount - days to add; negative subtracts.
   * @returns a new `Date`.
   */
  addDays: (date: Date, amount: number): Date => shift(date, amount, MS_PER_DAY),

  /**
   * `date` minus `amount` UTC days of exactly 24 hours.
   * @param date - the instant to start from; not mutated.
   * @param amount - days to subtract; negative adds.
   * @returns a new `Date`.
   */
  subDays: (date: Date, amount: number): Date => shift(date, -amount, MS_PER_DAY),

  /**
   * `date` plus `amount` calendar months on the UTC calendar, the day clamped to the target month's end.
   * @param date - the instant to start from; not mutated.
   * @param amount - whole months to add; negative subtracts.
   * @returns a new `Date`.
   */
  addMonths: (date: Date, amount: number): Date => shiftMonths(date, amount),

  /**
   * `date` minus `amount` calendar months on the UTC calendar, the day clamped to the target month's end.
   * @param date - the instant to start from; not mutated.
   * @param amount - whole months to subtract; negative adds.
   * @returns a new `Date`.
   */
  subMonths: (date: Date, amount: number): Date => shiftMonths(date, -amount),
});
