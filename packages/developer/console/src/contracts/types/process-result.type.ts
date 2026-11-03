/**
 * Stackra file contract:
 * Purpose: `ProcessResult`, how a child process ended: its exit code and its captured output (standard output and
 *          standard error interleaved; empty for an interactive child).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-007.
 */

/** A finished child process. */
export interface ProcessResult {
  /** The exit code; 1 when it was killed by a signal. */
  readonly code: number;

  /** Everything it wrote, in order. */
  readonly output: string;
}
