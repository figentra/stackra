/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardDraft`, where a drag on a SchedulingBoard would leave things: the range selected, or the
 *          item moved or resized, with its row before and after; what `conflictsOf` is asked about.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingChangeKind } from "#contracts/enums/scheduling-change-kind.enum";

/** A drag's would-be result. */
export interface SchedulingBoardDraft {
  /** What the drag does. */
  readonly change: SchedulingChangeKind;
  /** The item moved or resized; null for a selected range. */
  readonly itemId: string | null;
  /** The row the item was dragged from; null for a selected range. */
  readonly fromResourceId: string | null;
  /** The row it ends on. */
  readonly resourceId: string;
  /** Its start once dropped. */
  readonly start: Date;
  /** Its end once dropped. */
  readonly end: Date;
}
