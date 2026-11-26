/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardPreviewProps`, the props of the web SchedulingBoard's drag preview: the shared state and
 *          the drag in progress.
 * Boundary: types only; internal.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";
import type { SchedulingBoardDrag } from "#react/scheduling-board/scheduling-board-drag.type";

/** Props of the drag preview. */
export interface SchedulingBoardPreviewProps {
  /** The shared state. */
  readonly state: SchedulingBoardState;
  /** The drag in progress; the preview is drawn on its draft's row. */
  readonly drag: SchedulingBoardDrag;
}
