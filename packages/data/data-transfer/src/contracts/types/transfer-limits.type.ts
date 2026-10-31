/**
 * Stackra file contract:
 * Purpose: `TransferLimits`, the row, byte, column and cell-length ceilings a reader enforces while it streams.
 * Boundary: a type only. The values are settings the caller reads (OS-162); the package has no default for any.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 4); ADR 0363 (decisions 1 and 5).
 */

/** The ceilings of one read; an absent ceiling is not checked. */
export interface TransferLimits {
  /** The most data rows (headers excluded) across every sheet read. */
  readonly rows?: number;

  /** The most bytes of the file. */
  readonly bytes?: number;

  /** The most cells in one row; the XLSX reader checks it (STA-1736). */
  readonly columns?: number;

  /** The most characters in one cell; the XLSX reader checks it (STA-1736). */
  readonly cellLength?: number;
}
