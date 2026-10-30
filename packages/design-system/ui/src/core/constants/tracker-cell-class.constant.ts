/**
 * Stackra file contract:
 * Purpose: `TRACKER_CELL_CLASS`, the fill of a `TrackerStrip` cell by its state, in the theme's status colours: up is
 *          success, degraded warning, down danger, and a period with no data the default surface.
 * Boundary: class names only; the same Tailwind (web) and Uniwind (native) names on both runtimes.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { TrackerStatus } from "#contracts/enums/tracker-status.enum";

/** The fill class of each state. */
export const TRACKER_CELL_CLASS: Readonly<Record<TrackerStatus, string>> = Object.freeze({
  up: "bg-success",
  degraded: "bg-warning",
  down: "bg-danger",
  none: "bg-default",
});
