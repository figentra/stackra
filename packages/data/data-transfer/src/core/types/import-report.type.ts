/**
 * Stackra file contract:
 * Purpose: `ImportReport`, what a finished run returns: how many records it wrote and every refused row; for a dry
 *          run, how many rows would be written.
 * Boundary: a type only; it covers every batch of the run, including those of an earlier attempt. A dry run covers
 *           the rows of its own call only, writes nothing (`written` is 0) and records nothing.
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

  /** Present on a dry run only. */
  readonly dryRun?: true;

  /** On a dry run, the rows that passed the target's schema and would be written; absent otherwise. */
  readonly valid?: number;
}
