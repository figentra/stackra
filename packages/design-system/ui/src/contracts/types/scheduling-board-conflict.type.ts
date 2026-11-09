/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardConflict`, one reason a drag on a SchedulingBoard may be wrong, with its weight: the
 *          board's own (`closure`, `overlap`, `outside_hours`, `in_past`) or a screen's, through `conflictsOf`.
 * Boundary: types only; the board shows conflicts and passes them on, and never refuses a drop.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingConflictSeverity } from "#contracts/enums/scheduling-conflict-severity.enum";

/** One reason a drag may be wrong. */
export interface SchedulingBoardConflict {
  /** A snake_case code, for example `closure` or `coach_on_leave`. */
  readonly reason: string;
  /** `block` (red) or `warn` (amber). */
  readonly severity: SchedulingConflictSeverity;
  /** The words shown in the drag's hint; the board's own reasons have default words. */
  readonly message?: string | undefined;
}
