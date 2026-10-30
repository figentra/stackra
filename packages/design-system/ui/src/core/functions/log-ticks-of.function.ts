/**
 * Stackra file contract:
 * Purpose: `logTicksOf`, the ticks of a log value axis: every power of ten from the one at or below the smallest value
 *          above zero to the one at or above the largest, so the axis reads 10, 100, 1K, 10K and spans the data.
 * Boundary: pure. Values of zero or below, and non-numbers, are left out; with none left it gives [1, 10].
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */

/**
 * The powers of ten a log axis spans.
 * @example logTicksOf([12, 21_400]); // [10, 100, 1000, 10000, 100000]
 */
export function logTicksOf(values: readonly unknown[]): number[] {
  const positive = values.filter(
    (value): value is number => typeof value === "number" && value > 0,
  );
  if (positive.length === 0) return [1, 10];
  const low = Math.floor(Math.log10(Math.min(...positive)));
  const high = Math.max(low + 1, Math.ceil(Math.log10(Math.max(...positive))));
  return Array.from({ length: high - low + 1 }, (_, index) => 10 ** (low + index));
}
