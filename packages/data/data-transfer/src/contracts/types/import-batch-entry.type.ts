/**
 * Stackra file contract:
 * Purpose: `ImportBatchEntry`, one committed batch in the `ImportLedger`: its position, the sheet it read, the last row
 *          of that sheet it consumed, the changes it wrote and the rows it refused.
 * Boundary: a type only. Appending it advances the run's cursor to `lastRow`. A batch holds rows of one sheet, so a
 *           multi-sheet run resumes each sheet after its own last batch and reverts each batch through its sheet's
 *           target. `changes` is emptied when the ledger purges the run's before-images.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 7); ADR 0431 (decisions 1 and 3).
 */
import type { ImportChange } from "#contracts/types/import-change.type";
import type { RowError } from "#contracts/types/row-error.type";

/** A committed batch. */
export interface ImportBatchEntry {
  /** The 0-based batch number within the run. */
  readonly index: number;

  /** The sheet its rows came from (`""` for a CSV or JSON Lines file). */
  readonly sheet: string;

  /** The last row number of `sheet` the batch consumed. */
  readonly lastRow: number;

  /** The records it wrote. */
  readonly changes: readonly ImportChange[];

  /** The rows it refused. */
  readonly errors: readonly RowError[];
}
