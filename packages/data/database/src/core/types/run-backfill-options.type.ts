/**
 * Stackra file contract:
 * Purpose: `RunBackfillOptions`, how one run of a backfill goes: how many batches before it hands back (so a queue job
 *          takes a slice and queues itself again), whether it starts over, a cancel signal, and a progress callback.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs).
 */
import type { BackfillProgress } from "#core/types/backfill-progress.type";

/** The options of one backfill run. */
export interface RunBackfillOptions {
  /** The most batches this run commits before it returns unfinished; all of them by default. */
  readonly maxBatches?: number;

  /** Start from the first row again, for rows that became pending behind the cursor. */
  readonly restart?: boolean;

  /** Stops the run before its next batch once aborted; a batch in flight still commits. */
  readonly signal?: AbortSignal;

  /** Called after each committed batch. */
  readonly onBatch?: (progress: BackfillProgress) => void;

  /** Waits `ms` between batches; a timer by default, replaced in tests. */
  readonly sleep?: (ms: number) => Promise<void>;
}
