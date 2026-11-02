/**
 * Stackra file contract:
 * Purpose: `LiveHandle`, how a command drives a live view: change or add a row by name, then stop, which writes the
 *          final checklist (a row still pending or running is written as skipped) and returns its counts.
 * Boundary: a type only. A failed row in the final checklist ends the run with exit code 1, as a checklist does.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-004 and FR-009.
 */
import type { ChecklistSummary } from "#contracts/types/checklist-summary.type";
import type { LiveRow } from "#contracts/types/live-row.type";

/** A running live view. */
export interface LiveHandle {
  /** Changes the row named `name`, or adds `patch` as a new row when there is none. */
  readonly update: (name: string, patch: Partial<LiveRow>) => void;

  /** Ends the view and writes its final checklist. */
  readonly stop: () => ChecklistSummary;
}
