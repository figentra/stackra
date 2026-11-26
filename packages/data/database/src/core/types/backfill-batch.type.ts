/**
 * Stackra file contract:
 * Purpose: `BackfillBatch`, what a backfill's `apply(batch)` receives: the keys of the batch's rows, a predicate that
 *          selects exactly them, and the batch transaction's query function.
 * Boundary: a type only. `execute` runs inside the batch's transaction, which also moves the ledger's cursor, so a
 *           batch commits whole or not at all. SQL only, no parameters: `where` is built from literals the runner
 *           quoted.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs).
 */

/** One batch of a backfill. */
export interface BackfillBatch {
  /** The keyset values of the batch's rows, in order. */
  readonly keys: readonly unknown[];

  /** SQL selecting exactly the batch's rows (`"id" in ('ord_…', …)`), for the batch's `update … where ${where}`. */
  readonly where: string;

  /** Runs one statement in the batch's transaction and returns its rows. */
  readonly execute: (sql: string) => Promise<readonly Record<string, unknown>[]>;
}
