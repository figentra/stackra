/**
 * Stackra file contract:
 * Purpose: `percentile(sorted, p)`, the nearest-rank percentile of an ascending list of numbers.
 * Boundary: pure; the caller sorts. An empty list answers 0.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */

/**
 * The value at percentile `p` of `sorted` (nearest rank).
 *
 * @param sorted - ascending numbers.
 * @param p - the percentile, 0 to 100.
 * @throws RangeError when `p` is outside 0 to 100.
 * @example
 * percentile([1, 2, 3, 4], 50); // 2
 */
export function percentile(sorted: readonly number[], p: number): number {
  if (!(p >= 0 && p <= 100)) throw new RangeError(`percentile ${p} is outside 0 to 100`);
  if (sorted.length === 0) return 0;
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[rank - 1] ?? 0;
}
