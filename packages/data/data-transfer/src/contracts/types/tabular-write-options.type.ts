/**
 * Stackra file contract:
 * Purpose: `TabularWriteOptions`, the CSV writer's knobs: the delimiter, the UTF-8 byte order mark and the formula
 *          guard.
 * Boundary: a type only; the workbook writer ignores it.
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
}
