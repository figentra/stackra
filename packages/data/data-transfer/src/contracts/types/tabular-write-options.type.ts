/**
 * Stackra file contract:
 * Purpose: `TabularWriteOptions`, the writers' knobs: the CSV delimiter, the UTF-8 byte order mark and the formula
 *          guard, and the Parquet row group size.
 * Boundary: a type only; the workbook writer ignores it, and each other writer reads only its own fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 10).
 */

/** Options of one write. */
export interface TabularWriteOptions {
  /** The CSV delimiter; `,` when absent. */
  readonly delimiter?: string;

  /** Whether a CSV file starts with the UTF-8 byte order mark spreadsheet tools need to read Arabic; `true` when absent. */
  readonly byteOrderMark?: boolean;

  /** Whether a text cell that a spreadsheet would run as a formula is prefixed with `'`; `true` when absent. */
  readonly formulaGuard?: boolean;

  /** The rows per Parquet row group, so a large sheet is written in parts; the whole sheet is one group when absent. */
  readonly rowGroupRows?: number;
}
