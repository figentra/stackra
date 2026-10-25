/**
 * Stackra file contract:
 * Purpose: `TransferLimits`, the row and byte ceilings a reader enforces while it streams.
 * Boundary: a type only. The values are settings the caller reads (OS-162); the package has no default for either.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 4); ADR 0363 (decisions 1 and 5).
 */

/** The ceilings of one read; an absent ceiling is not checked. */
export interface TransferLimits {
  /** The most data rows (headers excluded) across every sheet read. */
  readonly rows?: number;

  /** The most bytes of the file. */
  readonly bytes?: number;
}
