/**
 * Stackra file contract:
 * Purpose: `heatLevelOf`, which of five shades a heatmap cell takes: 0 for nothing (zero, a gap or below the scale),
 *          then 1 to 4 in equal steps from the smallest to the largest value.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */

/**
 * The shade of `value` on a scale from `min` to `max`.
 * @example heatLevelOf(10, 0, 10); // 4
 */
export function heatLevelOf(value: number | null | undefined, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 0;
  if (max <= min) return 4;
  return Math.min(4, Math.max(1, Math.ceil(((value - min) / (max - min)) * 4)));
}
