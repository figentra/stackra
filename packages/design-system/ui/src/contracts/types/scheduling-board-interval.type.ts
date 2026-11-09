/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardInterval`, one stretch of working time on a SchedulingBoard: on one row, or on every row
 *          when no row is named; time outside every stretch of a row is shaded.
 * Boundary: types only; the stretches are already expanded for the range shown (the engine's `calendar_day.list`),
 *           so the board does no weekday arithmetic.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */

/** One stretch of working time. */
export interface SchedulingBoardInterval {
  /** The row it applies to; every row when left out. */
  readonly resourceId?: string | undefined;
  /** When it starts. */
  readonly start: Date;
  /** When it ends. */
  readonly end: Date;
}
