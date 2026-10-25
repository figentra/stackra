/**
 * Stackra file contract:
 * Purpose: `instantMs`, an ISO 8601 instant with an offset (`2026-10-25T09:00:00Z`, `...+03:00`) as epoch milliseconds.
 * Boundary: internal. A local time without an offset is refused, because it names no instant.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 5).
 */

/** An ISO instant with `Z` or `±HH:mm`. */
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * The epoch milliseconds of `instant`.
 *
 * @example
 * instantMs("1970-01-01T00:00:01Z"); // 1000
 */
export function instantMs(instant: string): number {
  const ms = INSTANT.test(instant) ? Date.parse(instant) : Number.NaN;
  if (Number.isNaN(ms)) throw new RangeError(`Not an ISO instant with an offset: ${instant}`);
  return ms;
}
