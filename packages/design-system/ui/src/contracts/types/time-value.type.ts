/**
 * Stackra file contract:
 * Purpose: `TimeValue`, a time of day without a date or zone: the hour (0-23) and the minute.
 * Boundary: types only; `@internationalized/date`'s `Time` fits it, so a value from React Aria passes as is.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305.
 */

/** A time of day. */
export interface TimeValue {
  /** The hour, 0 to 23. */
  readonly hour: number;
  /** The minute, 0 to 59. */
  readonly minute: number;
}
