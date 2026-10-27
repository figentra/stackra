/**
 * Stackra file contract:
 * Purpose: `WorkbookImportOptions`, one call of `ImportRunner.runSheets`: the run id, the rows of a workbook, the
 *          sheets to import in dependency order with their mappings and targets, the batch size, and whether it is a
 *          dry run.
 * Boundary: a type only. `batchSize` is the caller's setting; a sheet the options do not name is read past and
 *           ignored. Mapping profiles from a seed pack supply each sheet's `mapping`.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 1); ADR 0367 (decision 7).
 */
import type { TabularRow } from "#contracts/types/tabular-row.type";

import type { SheetImport } from "#core/types/sheet-import.type";

/** What to import from a workbook. */
export interface WorkbookImportOptions {
  /** The run id; the same id resumes the run. */
  readonly runId: string;

  /** The rows of the workbook, each sheet header first (a reader's output). */
  readonly rows: AsyncIterable<TabularRow>;

  /** The sheets to import, in the order their targets depend on each other; names are unique. */
  readonly sheets: readonly SheetImport<unknown>[];

  /** Rows per batch (valid and refused together); a batch never spans two sheets. */
  readonly batchSize: number;

  /**
   * Checks every row without writing: no target `upsert`, no ledger record, no resume cursor. The report counts the
   * rows that would be written (`valid`) and lists every refused row. False by default.
   */
  readonly dryRun?: boolean;
}
