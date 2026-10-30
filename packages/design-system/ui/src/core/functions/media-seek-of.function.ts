/**
 * Stackra file contract:
 * Purpose: `mediaSeekOf(to, duration)`, a seek target kept inside the file: never before 0 and never past the length
 *          (a length not known yet counts as 0).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/**
 * The position to seek to, in seconds.
 * @example mediaSeekOf(70, 65); // 65
 */
export function mediaSeekOf(to: number, duration: number): number {
  return Math.min(Math.max(0, to), Number.isFinite(duration) ? Math.max(0, duration) : 0);
}
