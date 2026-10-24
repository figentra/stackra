/**
 * Stackra file contract:
 * Purpose: one column of a Table: its key, its header text and whether the header can sort it, so both runtimes draw
 *          the same columns from the same data.
 * Boundary: types only. `id` is also the key `renderCell` is asked about and the `column` a `SortDescriptor` holds.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313.
 */
import type { TextAlign } from "#contracts/enums/text-align.enum";

/** One column of a Table. */
export interface TableColumn {
  /** The key of the column; unique within the table, and the `column` of the sort when it is sorted. */
  readonly id: string;
  /** The header text; it is the column's accessible name. */
  readonly label: string;
  /** True for the column whose cell names the row to assistive technology; left out, the first column is it. */
  readonly isRowHeader?: boolean | undefined;
  /** True to let a press on the header ask for a sort by this column; the app sorts, never the table. */
  readonly isSortable?: boolean | undefined;
  /** How the column's text lines up. Defaults to `start`. */
  readonly align?: TextAlign | undefined;
}
