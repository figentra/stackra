/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardRange`, an empty range selected on one row of a SchedulingBoard, with its conflicts:
 *          what `onSelectRange` receives, for the screen to offer a booking.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardConflict } from "#contracts/types/scheduling-board-conflict.type";

/** A selected range. */
export interface SchedulingBoardRange {
  /** The row. */
  readonly resourceId: string;
  /** Its start, on a slot boundary. */
  readonly start: Date;
  /** Its end, on a slot boundary. */
  readonly end: Date;
  /** The board's and the screen's conflicts at the range. */
  readonly conflicts: readonly SchedulingBoardConflict[];
}
