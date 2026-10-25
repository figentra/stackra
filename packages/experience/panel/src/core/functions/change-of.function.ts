/**
 * Stackra file contract:
 * Purpose: `changeOf(metric)`, a metric's change against the previous period as a ratio (`0.25` is up a quarter).
 * Boundary: internal: pure; the renderers import it by path. Null without a value or a previous value, or when the previous
 *           value is zero (no ratio exists).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15: the trend comes from the type).
 */

/**
 * The change of `metric` against its previous value.
 *
 * @example
 * changeOf({ value: 5_000, previous: 4_000 }); // 0.25
 */
export function changeOf(metric: {
  readonly value: number | null;
  readonly previous: number | null;
}): number | null {
  const { value, previous } = metric;
  if (value === null || previous === null || previous === 0) return null;
  return (value - previous) / previous;
}
