/**
 * Stackra file contract:
 * Purpose: `starFillOf`, how much of the star at `position` (1-based) a rating of `value` fills: 1 whole, 0 empty, and
 *          a fraction for the star the value ends inside (3.5 fills half of star 4).
 * Boundary: a pure function; both runtimes' Rating draw the fraction as a clipped copy of the icon.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (gap build, owner approval 2026-10-31).
 */

/** The share, 0 to 1, of the star at `position` that `value` fills. */
export function starFillOf(value: number, position: number): number {
  return Math.min(1, Math.max(0, value - position + 1));
}
