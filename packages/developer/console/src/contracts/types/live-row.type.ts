/**
 * Stackra file contract:
 * Purpose: `LiveRow`, one row of a live view (a check that is still running): a checklist row whose status may also be
 *          pending or running until it settles.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-002 and FR-004.
 */
import type { CheckRow } from "#contracts/types/check-row.type";
import type { CheckStatus } from "#contracts/types/check-status.type";

/** A row that may still be running. */
export type LiveRow = Omit<CheckRow, "status"> & {
  /** How it is going; pending and running rows are drawn with a spinner, and settle into a checklist status. */
  readonly status: CheckStatus | "pending" | "running";
};
