/**
 * Stackra file contract:
 * Purpose: `mediaVolumeOf(to)`, a volume a player sets: between 0 and 1, rounded to hundredths so repeated steps do
 *          not drift (0.1 + 0.2).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/**
 * The volume to set, of 1.
 * @example mediaVolumeOf(0.30000000000000004); // 0.3
 */
export function mediaVolumeOf(to: number): number {
  return Math.min(1, Math.max(0, Math.round(to * 100) / 100));
}
