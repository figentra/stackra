/**
 * Stackra file contract:
 * Purpose: `WritableText`, the one thing the kernel needs of standard output and standard error.
 * Boundary: a type only; `process.stdout` satisfies it, and so do the testing harness's memory streams.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012 and FR-027.
 */

/** A text stream the console writes to. */
export interface WritableText {
  /** Writes `text` as it is. */
  readonly write: (text: string) => void;
}
