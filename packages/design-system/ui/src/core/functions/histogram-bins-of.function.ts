/**
 * Stackra file contract:
 * Purpose: `histogramBinsOf`, raw values counted into equal-width bins: `binWidth` when given, else `binCount`, else
 *          Sturges' rule (1 + log2 n bins). Bins start at the smallest value and the last one includes the largest.
 * Boundary: pure. Non-finite values are left out; no values give no bins; equal values give one bin.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same bins on web and native); STA-1371.
 */
import type { HistogramBin } from "#core/types/histogram-bin.type";

/**
 * The bins of `values`.
 * @example histogramBinsOf([1, 2, 2, 9], { binCount: 2 }); // [{ from: 1, to: 5, count: 3 }, { from: 5, to: 9, count: 1 }]
 */
export function histogramBinsOf(
  values: readonly number[],
  options: { readonly binCount?: number | undefined; readonly binWidth?: number | undefined } = {},
): HistogramBin[] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) return [{ from: min, to: max, count: finite.length }];
  const count =
    options.binWidth && options.binWidth > 0
      ? Math.ceil((max - min) / options.binWidth)
      : Math.max(1, Math.round(options.binCount ?? Math.ceil(Math.log2(finite.length) + 1)));
  const width = options.binWidth && options.binWidth > 0 ? options.binWidth : (max - min) / count;
  const counts = Array.from({ length: count }, () => 0);
  for (const value of finite) {
    const at = Math.min(count - 1, Math.floor((value - min) / width));
    counts[at] = (counts[at] ?? 0) + 1;
  }
  return counts.map((total, index) => ({
    from: min + index * width,
    to: min + (index + 1) * width,
    count: total,
  }));
}
