/**
 * Stackra file contract:
 * Purpose: the `time` helpers: fixed-length shifts of an instant (seconds, minutes, hours, UTC days) that return a new
 *          `Date` and never mutate their input, so callers compute cutoffs such as
 *          `time.subMinutes(ctx.now(), 30)` without hand arithmetic.
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
 * Fixed-length time arithmetic over instants. Every helper takes a `Date` and an amount, returns a new `Date` and
 * leaves the input untouched. A negative amount shifts the other way; a fractional amount is allowed and the result
 * is truncated to whole milliseconds by `Date`.
 *
 * Units are exact lengths on the UTC timeline: a minute is 60 s, an hour 3,600 s and a day 86,400 s. A `Date` is a
 * UTC instant, so `addDays` moves the UTC calendar date by whole days; across a daylight-saving change in some zone
 * the local wall-clock hour shifts by the offset change, which is the intended behaviour for cutoffs and expiries.
 * Calendar months and years are not offered: they need a time zone and a clamping rule, and no consumer needs them.
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
});
