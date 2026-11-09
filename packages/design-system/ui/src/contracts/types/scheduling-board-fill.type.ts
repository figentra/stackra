/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardFill`, how full a group session is, shown on its block as "8/12".
 * Boundary: types only; the counts are the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */

/** Seats taken of seats offered. */
export interface SchedulingBoardFill {
  /** Seats taken. */
  readonly used: number;
  /** Seats offered. */
  readonly total: number;
}
