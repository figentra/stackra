/**
 * Stackra file contract:
 * Purpose: `ImportOptions`, one call of `ImportRunner.run`: the run id, the rows, the mapping, the target and the batch
 *          size, and whether it is a dry run.
 * Boundary: a type only. `batchSize` is the caller's setting. The rows come from one sheet.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 7).
 */
import type { ImportTarget } from "#contracts/types/import-target.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";

import type { ColumnMapping } from "#core/types/column-mapping.type";

/** What to import. */
export interface ImportOptions<T> {
  /** The run id; the same id resumes the run. */
  readonly runId: string;

  /** The rows of one sheet, header first (a reader's output). */
  readonly rows: AsyncIterable<TabularRow>;

  /** Field name to header text. */
  readonly mapping: ColumnMapping;

  /** The importable model. */
  readonly target: ImportTarget<T>;

  /** Rows per batch (valid and refused together). */
  readonly batchSize: number;

  /**
   * Checks every row without writing: no target `upsert`, no ledger record, no resume cursor. The report counts the
   * rows that would be written (`valid`) and lists every refused row. False by default.
   */
  readonly dryRun?: boolean;
}
