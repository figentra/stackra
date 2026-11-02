/**
 * Stackra file contract:
 * Purpose: `LiveView`, a screen that redraws while work runs (running checks, a status dashboard): a title and its
 *          rows.
 * Boundary: a type only. Redrawn only while output animates; otherwise only its final checklist is written.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-002 and FR-004.
 */
import type { LiveRow } from "#contracts/types/live-row.type";

/** A live screen. */
export interface LiveView {
  /** A title above the rows. */
  readonly title?: string;

  /** The rows, in order. */
  readonly rows: readonly LiveRow[];
}
