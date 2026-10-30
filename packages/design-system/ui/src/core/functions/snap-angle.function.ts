/**
 * Stackra file contract:
 * Purpose: `snapAngle(angle, step)`, an angle rounded to the nearest multiple of `step` degrees and wrapped into 0 to
 *          359, so 359.6 with a step of 1 is 0 and -15 is 345.
 * Boundary: pure; a step under 1 counts as 1.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */

/**
 * `angle` on the `step` grid, wrapped into one turn.
 * @example snapAngle(47, 15); // 45
 */
export function snapAngle(angle: number, step: number): number {
  const grid = Math.max(1, step);
  const snapped = Math.round(angle / grid) * grid;
  return ((snapped % 360) + 360) % 360;
}
