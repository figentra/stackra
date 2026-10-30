/**
 * Stackra file contract:
 * Purpose: `valueLevelOf`, which of `levels` equal steps between `min` and `max` a value falls in: the shade a heat
 *          cell or map region takes.
 * Boundary: pure. The lowest value is level 0 and the highest the top level; with no spread every value is the top.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */

/**
 * The step of `value`, 0 to `levels - 1`.
 * @example valueLevelOf(50, 0, 100); // 2
 */
export function valueLevelOf(value: number, min: number, max: number, levels = 5): number {
  if (max <= min) return levels - 1;
  const share = (value - min) / (max - min);
  return Math.max(0, Math.min(levels - 1, Math.floor(share * levels)));
}
