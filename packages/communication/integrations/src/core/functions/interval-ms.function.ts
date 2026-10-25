/**
 * Stackra file contract:
 * Purpose: `intervalMs`, which reads an `Interval` (`"1s"`, `"200ms"`, `"6h"`) as milliseconds.
 * Boundary: internal; the Integration's option check and the managed client call it. A malformed or negative interval
 *           is a declaration mistake, so it throws a `RangeError` rather than a refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13).
 */
import type { Interval } from "#core/types/interval.type";

/** Milliseconds per unit. */
const UNITS: Readonly<Record<string, number>> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** A non-negative decimal number and its unit. */
const INTERVAL = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/;

/**
 * The length of `interval` in milliseconds, rounded to a whole one.
 *
 * @throws RangeError when `interval` is not a non-negative number followed by `ms`, `s`, `m`, `h` or `d`.
 * @example
 * intervalMs("1s"); // 1000
 */
export function intervalMs(interval: Interval): number {
  const match = INTERVAL.exec(interval);
  const unit = match === null ? undefined : UNITS[match[2] ?? ""];
  if (match === null || unit === undefined)
    throw new RangeError(
      `"${interval}" is not an interval such as "200ms", "1s", "5m", "6h" or "1d"`,
    );
  return Math.round(Number(match[1]) * unit);
}
