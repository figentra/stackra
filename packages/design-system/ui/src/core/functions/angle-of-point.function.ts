/**
 * Stackra file contract:
 * Purpose: `angleOfPoint(dx, dy)`, the angle of a point seen from a dial's centre, in degrees clockwise from the top
 *          (12 o'clock), from 0 up to (not including) 360.
 * Boundary: pure; screen coordinates (y grows downward). Absolute: the same in right-to-left.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */

/**
 * The angle of the point `dx`, `dy` from the centre.
 * @example angleOfPoint(10, 0); // 90 (3 o'clock)
 */
export function angleOfPoint(dx: number, dy: number): number {
  const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return ((degrees % 360) + 360) % 360;
}
