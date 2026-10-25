/**
 * Stackra file contract:
 * Purpose: `ImportReport`, what a finished run returns: how many records it wrote and every refused row.
 * Boundary: a type only; it covers every batch of the run, including those of an earlier attempt.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 6 and 7).
 */
import type { RowError } from "#contracts/types/row-error.type";

/** The outcome of a run. */
export interface ImportReport {
  /** The run id. */
  readonly runId: string;

  /** The records written. */
  readonly written: number;

  /** The rows refused. */
  readonly errors: readonly RowError[];
}
