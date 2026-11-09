/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardDrag`, a drag in progress on the web SchedulingBoard: where it started and where it would
 *          leave things, the block it carries, whether a pointer or the keyboard drives it, and the pointer's place
 *          for the hint.
 * Boundary: types only; internal to the web SchedulingBoard.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import type { PlacedSchedulingItem } from "#core/types/placed-scheduling-item.type";

/** A drag in progress. */
export interface SchedulingBoardDrag {
  /** What drives it; a pointer's hint follows the pointer, the keyboard's sits under the preview. */
  readonly source: "pointer" | "keyboard";
  /** Where it would leave things now. */
  readonly draft: SchedulingBoardDraft;
  /** Where it started, to tell a move from a resize and a drop from no change. */
  readonly origin: SchedulingBoardDraft;
  /** The block it carries; null for a selected range. */
  readonly placed: PlacedSchedulingItem | null;
  /** The pointer's viewport point, x then y; null for the keyboard. */
  readonly point: readonly [x: number, y: number] | null;
}
