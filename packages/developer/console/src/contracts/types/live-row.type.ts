/**
 * Stackra file contract:
 * Purpose: `LiveRow`, one row of a live view (a check that is still running): a checklist row whose status may also be
 *          pending or running until it settles.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-002 and FR-004.
 */
import type { CheckStatus } from "#contracts/types/check-status.type";

/** A row that may still be running; a `CheckRow` once it settles. */
export interface LiveRow {
  /** What is checked. */
  readonly name: string;

  /** How it is going; pending and running rows are drawn with a spinner, and settle into a checklist status. */
  readonly status: CheckStatus | "pending" | "running";

  /** What was found. */
  readonly detail?: string;

  /** The exact command that fixes it. */
  readonly fix?: string;

  /** The heading it sits under. */
  readonly group?: string;

  /** Fields of the command's own, kept for `--json`. */
  readonly [extra: string]: unknown;
}
