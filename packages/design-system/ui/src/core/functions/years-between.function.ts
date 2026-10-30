/**
 * Stackra file contract:
 * Purpose: `yearsBetween(min, max)`, every year from `min` to `max`, both kept, in order.
 * Boundary: pure; an empty list when `max` is before `min`.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */

/**
 * The years from `min` to `max`.
 * @param min - the first year
 * @param max - the last year
 * @returns the years, ascending
 */
export function yearsBetween(min: number, max: number): number[] {
  return max < min ? [] : Array.from({ length: max - min + 1 }, (_, index) => min + index);
}
