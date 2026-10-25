/**
 * Stackra file contract:
 * Purpose: `ImportBatchEntry`, one committed batch in the `ImportLedger`: its position, the last row it consumed, the
 *          changes it wrote and the rows it refused.
 * Boundary: a type only. Appending it advances the run's cursor to `lastRow`.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 7).
 */
import type { ImportChange } from "#contracts/types/import-change.type";
import type { RowError } from "#contracts/types/row-error.type";

/** A committed batch. */
export interface ImportBatchEntry {
  /** The 0-based batch number within the run. */
  readonly index: number;

  /** The last row number the batch consumed. */
  readonly lastRow: number;

  /** The records it wrote. */
  readonly changes: readonly ImportChange[];

  /** The rows it refused. */
  readonly errors: readonly RowError[];
}
