/**
 * Stackra file contract:
 * Purpose: `TableSpec`, a table as data: its columns, its rows (records read by column key) and an optional key to
 *          group rows under headings.
 * Boundary: a type only. Under `--json` the rows are the data, exactly as given.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-008 and FR-030.
 */
import type { TableColumn } from "#contracts/types/table-column.type";

/** A table to draw. */
export interface TableSpec {
  /** The columns, in order. */
  readonly columns: readonly TableColumn[];

  /** The rows; each cell is `row[column.key]`. */
  readonly rows: readonly Readonly<Record<string, unknown>>[];

  /** A row field whose value heads a group of rows, in first-seen order. */
  readonly groupBy?: string;

  /** A title above the table. */
  readonly title?: string;
}
