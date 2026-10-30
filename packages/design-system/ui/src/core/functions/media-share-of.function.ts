/**
 * Stackra file contract:
 * Purpose: `mediaShareOf(part, max)`, how much of a MediaPlayer track a position fills, from 0 to 1 (0 while the length
 *          is not known).
 * Boundary: pure; the web and native tracks turn it into a width and the thumb's place.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/**
 * The filled share of the track.
 * @example mediaShareOf(13, 65); // 0.2
 */
export function mediaShareOf(part: number, max: number): number {
  return max > 0 ? Math.min(1, Math.max(0, part / max)) : 0;
}
