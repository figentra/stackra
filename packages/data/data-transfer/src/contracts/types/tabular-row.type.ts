/**
 * Stackra file contract:
 * Purpose: `TabularRow`, one row a `TabularReader` yields: the sheet it belongs to, its row number as a spreadsheet
 *          shows it, and its cells as text.
 * Boundary: a type only. A CSV file has one sheet, named `""`. The first row a sheet yields is its header.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 2 and 6).
 */

/** One row of a sheet. */
export interface TabularRow {
  /** The sheet name (`""` for a CSV file). */
  readonly sheet: string;

  /** The 1-based row number in the sheet; a quoted line break inside a CSV cell does not count. */
  readonly row: number;

  /** The cells as text, in column order; an empty cell is `""`. */
  readonly cells: readonly string[];
}
