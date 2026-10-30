/**
 * Stackra file contract:
 * Purpose: `uptimeShareOf`, the share of a `TrackerStrip`'s periods that were up: `up` and `degraded` count as up,
 *          `down` as down, and `none` (no data) is left out.
 * Boundary: pure; null when no period has data.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { TrackerCell } from "#contracts/types/tracker-cell.type";

/** The share (0 to 1) of the known periods that were up, or null when none is known. */
export function uptimeShareOf(cells: readonly TrackerCell[]): number | null {
  const known = cells.filter((cell) => cell.status !== "none");
  if (known.length === 0) return null;
  return known.filter((cell) => cell.status !== "down").length / known.length;
}
