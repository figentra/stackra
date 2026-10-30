/**
 * Stackra file contract:
 * Purpose: `changeOf`, the change from the previous period to this one as a fraction (0.12 is up 12%), the trend a
 *          `Stat` shows when it is given `previousValue` and no `trend`.
 * Boundary: pure; undefined when there is nothing to compare with (a text value, or a zero or missing previous value).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decision 15); STA-1371.
 */

/** The fractional change from `previous` to `value`, or undefined when it cannot be worked out. */
export function changeOf(value: number | string, previous: number | undefined): number | undefined {
  if (typeof value !== "number" || previous === undefined || previous === 0) return undefined;
  return (value - previous) / Math.abs(previous);
}
