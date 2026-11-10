/**
 * Stackra file contract:
 * Purpose: `SchedulingConflictContext`, what `schedulingConflictsOf` reads a draft against: the rows, the items,
 *          the working time and now.
 * Boundary: types only; internal to the web and native SchedulingBoard.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardInterval } from "#contracts/types/scheduling-board-interval.type";
import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";

/** The board's state a draft is checked against. */
export interface SchedulingConflictContext {
  /** Every row of the board. */
  readonly resources: readonly SchedulingBoardResource[];
  /** Every item on the board. */
  readonly items: readonly SchedulingBoardItem[];
  /** Working time; none checks no hours. */
  readonly workingTime?: readonly SchedulingBoardInterval[] | undefined;
  /** The current time the checks use. */
  readonly now: Date;
}
