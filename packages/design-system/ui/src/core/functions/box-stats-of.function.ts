/**
 * Stackra file contract:
 * Purpose: `boxStatsOf`, a box plot group's five-number summary: quartiles by linear interpolation (the spreadsheet
 *          QUARTILE.INC rule), Tukey whiskers reaching the furthest values within 1.5 IQR of the box, and the
 *          outliers beyond them.
 * Boundary: pure. Non-finite values are left out; no values give null.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same summary on web and native); STA-1371.
 */
import type { BoxStats } from "#core/types/box-stats.type";

/** The `p` quantile (0 to 1) of sorted values. */
function quantile(sorted: readonly number[], p: number): number {
  const at = (sorted.length - 1) * p;
  const below = Math.floor(at);
  const low = sorted[below] ?? 0;
  const high = sorted[Math.min(sorted.length - 1, below + 1)] ?? low;
  return low + (high - low) * (at - below);
}

/**
 * The summary of `values`.
 * @example boxStatsOf([1, 2, 3, 4, 100]); // { q1: 2, median: 3, q3: 4, low: 1, high: 4, outliers: [100], ... }
 */
export function boxStatsOf(values: readonly number[]): BoxStats | null {
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const reach = 1.5 * (q3 - q1);
  const inside = sorted.filter((value) => value >= q1 - reach && value <= q3 + reach);
  return {
    min: sorted[0] ?? 0,
    max: sorted.at(-1) ?? 0,
    q1,
    median: quantile(sorted, 0.5),
    q3,
    low: inside[0] ?? q1,
    high: inside.at(-1) ?? q3,
    outliers: sorted.filter((value) => value < q1 - reach || value > q3 + reach),
  };
}
