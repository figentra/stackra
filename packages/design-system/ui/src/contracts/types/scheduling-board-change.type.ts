/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardChange`, an item moved or resized on a SchedulingBoard, with its conflicts: what
 *          `onItemChange` receives, for the screen to ask the engine (`booking.move` with a preview).
 * Boundary: types only; the board holds the item where it was dropped while the screen's promise is open.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardConflict } from "#contracts/types/scheduling-board-conflict.type";

/** An item moved or resized. */
export interface SchedulingBoardChange {
  /** The item. */
  readonly itemId: string;
  /** `move` or `resize`. */
  readonly change: "move" | "resize";
  /** The row it was dragged from (one of its rows). */
  readonly fromResourceId: string;
  /** The row it was dropped on; the same row for a resize. */
  readonly toResourceId: string;
  /** Its new start. */
  readonly start: Date;
  /** Its new end. */
  readonly end: Date;
  /** The board's and the screen's conflicts where it was dropped. */
  readonly conflicts: readonly SchedulingBoardConflict[];
}
