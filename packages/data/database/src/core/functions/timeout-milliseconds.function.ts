/**
 * Stackra file contract:
 * Purpose: `timeoutMilliseconds(duration)`, a configured or declared timeout as the whole number of milliseconds
 *          Postgres reads a bare `statement_timeout`/`lock_timeout` value in.
 * Boundary: internal to the drivers and `sessionTimeoutsUrl`; the result is a number, so it is safe to write into a
 *           `set` statement or a startup option.
 * Runtime: isomorphic
 * Governing contract: data-layer gap sc5 (stackra-253).
 */
import { Duration } from "@stackra/contracts";

/**
 * Whole milliseconds of `duration`, rounded up.
 *
 * @throws RangeError when the duration is not a finite, non-negative length.
 * @example
 * timeoutMilliseconds(Duration.seconds(30)); // 30000
 */
export function timeoutMilliseconds(duration: Duration): number {
  const value = Math.ceil(Duration.toMilliseconds(duration));
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${duration} is not a timeout`);
  return value;
}
