/**
 * Stackra file contract:
 * Purpose: `pointChangeOf(metric)`, a percent metric's change against the previous period in percentage points (0.6 to
 *          0.67 is up 7 points), the trend of a rate where a relative change would mislead.
 * Boundary: internal: pure; the renderers import it by path. Null without a value or a previous value; a zero previous
 *           value is a real rate, so it still gives a change.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15: the trend comes from the type).
 */

/**
 * The change of the ratio `metric` against its previous ratio, in percentage points.
 *
 * @example
 * pointChangeOf({ value: 0.67, previous: 0.6 }); // 7 (to float precision)
 */
export function pointChangeOf(metric: {
  readonly value: number | null;
  readonly previous: number | null;
}): number | null {
  const { value, previous } = metric;
  if (value === null || previous === null) return null;
  return (value - previous) * 100;
}
