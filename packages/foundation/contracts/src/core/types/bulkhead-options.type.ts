/**
 * Stackra file contract:
 * Purpose: `BulkheadOptions`, what `new Bulkhead(...)` takes: how many calls run at once, how many more may wait for a
 *          place, and how long one waits before it is turned away.
 * Boundary: a type only; the constructor checks the numbers (`RangeError`).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (a turned-away call is an `Unavailable` refusal of the caller); STA-1467.
 */

/**
 * The options of a bulkhead.
 *
 * @example
 * const options: BulkheadOptions = { limit: 1024, queue: 1024, maxWaitMs: 5000 };
 */
export interface BulkheadOptions {
  /** How many calls hold a place at once; a whole number from 1. */
  readonly limit: number;

  /** How many more calls may wait for a place; 0 (none: a call is turned away at once) when left out. */
  readonly queue?: number;

  /** How long a call waits for a place before it is turned away, in milliseconds; unbounded when left out. */
  readonly maxWaitMs?: number;
}
