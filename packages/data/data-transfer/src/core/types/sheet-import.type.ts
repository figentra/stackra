/**
 * Stackra file contract:
 * Purpose: `SheetImport`, one sheet of a workbook import: the sheet's name, its column mapping and the target its rows
 *          are written to.
 * Boundary: a type only. The order of the sheets in `WorkbookImportOptions` is the order the targets depend on
 *           (products before variants), and the file must list them in that order.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 1); ADR 0367 (decisions 5 to 7).
 */
import type { ImportTarget } from "#contracts/types/import-target.type";

import type { ColumnMapping } from "#core/types/column-mapping.type";

/** One sheet and its target. */
export interface SheetImport<T> {
  /** The sheet name as the workbook has it. */
  readonly sheet: string;

  /** Field name to header text, for this sheet. */
  readonly mapping: ColumnMapping;

  /** The importable model this sheet feeds. */
  readonly target: ImportTarget<T>;
}
