/**
 * Stackra file contract:
 * Purpose: `JobBatch`, the progress of a group of jobs queued together: how many were queued, how many are done and
 *          how many failed for good (dead-lettered or dropped). The batch is finished when `done + failed` is `total`.
 * Boundary: a type only; `QueueService.batch` opens it, the worker settles one job of it per final outcome, and
 *           `QueueService.progress` reads it. A retried attempt settles nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: batches and progress).
 */

/** A batch of jobs. */
export interface JobBatch {
  /** The batch id (`jbt_…`). */
  readonly id: string;

  /** Jobs queued in the batch. */
  readonly total: number;

  /** Jobs that finished. */
  readonly done: number;

  /** Jobs that failed for good. */
  readonly failed: number;
}
