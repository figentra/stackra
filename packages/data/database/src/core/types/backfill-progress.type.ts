/**
 * Stackra file contract:
 * Purpose: `BackfillProgress`, where a backfill stands after a batch or a run: its ledger row's counts and cursor, and
 *          whether it reached the end.
 * Boundary: a type only; read from `database.backfill_runs`, which keeps it across runs and workers.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs, resumable).
 */

/** A backfill's progress. */
export interface BackfillProgress {
  /** The backfill's key. */
  readonly key: string;

  /** Rows filled across every run. */
  readonly rows: number;

  /** Batches committed across every run. */
  readonly batches: number;

  /** The keyset value of the last row reached, as text; null before the first batch or after a restart. */
  readonly cursor: string | null;

  /** Whether the last batch found no more pending rows past the cursor. */
  readonly finished: boolean;
}
