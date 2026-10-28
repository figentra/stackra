/**
 * Stackra file contract:
 * Purpose: the `QueueDriver` port: the store behind `QueueService` and `QueueWorkerService`. It keeps jobs, hands the
 *          next due one to one worker at a time, and records how each attempt ended. Config `queue.driver` picks the
 *          driver (`postgres`, `memory`, `broker`). `claim` takes a job a broker delivered instead of one `reserve` found.
 *          A reservation is fair: the highest priority first, then the scope with the fewest running jobs, then the
 *          oldest `runAt`, and never past a job's `scopeConcurrency`. Batches keep their progress in the store.
 * Boundary: an abstract class that is its own token, keyed `queue.QueueDriver`. A driver stores and reserves; it never
 *           runs a job, computes a backoff or reads a clock: the worker passes `now` and the retry time, so every
 *           driver behaves the same to a caller. A reservation that lapses (a worker that died) makes the job due again
 *           for the next `reserve`. A leaf file: it imports nothing outside `src/contracts` but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1, 2 and 3: job features, fair queues, Postgres with SKIP LOCKED); ADR 0142 (drivers behind
 *                     ports); ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

import type { JobBatch } from "#contracts/types/job-batch.type";
import type { JobError } from "#contracts/types/job-error.type";
import type { QueuedJob } from "#contracts/types/queued-job.type";

/**
 * A job store.
 *
 * @example
 * export class ValkeyQueueDriver extends Driver(QueueDriver) {
 *   async push(job: QueuedJob): Promise<boolean> { ... }
 * }
 */
export abstract class QueueDriver extends Port {
  /** Type-only port key, so `DriverName<QueueDriver>` narrows to this port's drivers. */
  declare readonly "~key": "queue.QueueDriver";

  /**
   * Takes a job a broker delivered (`QueueWorkerService.process`) and answers it as reserved. A store's `reserve`
   * already marked the job it hands out, so this default answers `job` as it is; the `broker` driver marks it running
   * with one more attempt, and rejects one that is not due yet so the broker delivers it again later.
   */
  claim(job: QueuedJob, _now: Date): Promise<QueuedJob> {
    return Promise.resolve(job);
  }

  /** Stores `job` as waiting; `false`, storing nothing, when a waiting or running job holds its `uniqueKey`. */
  abstract push(job: QueuedJob): Promise<boolean>;

  /**
   * The next job of `queue` (of any queue when `undefined`) due at `now`: a waiting job whose `runAt` has come, or a
   * running one whose reservation lapsed. Among them the highest `priority` wins, then the job whose scope (on its
   * queue) has the fewest jobs running, then the oldest `runAt`; a job whose scope already runs `scopeConcurrency`
   * jobs on its queue is skipped. It is marked running with one more attempt and held until `now` plus its `lease`; no
   * other `reserve` returns it meanwhile. `undefined` when none is due.
   */
  abstract reserve(queue: string | undefined, now: Date): Promise<QueuedJob | undefined>;

  /** Makes job `id` wait again until `runAt`, keeping `error` as its last failure. */
  abstract retry(id: PublicId<"job">, runAt: Date, error: JobError): Promise<void>;

  /** Makes running job `id` wait again until `runAt` without counting the attempt its reservation took (a throttle). */
  abstract release(id: PublicId<"job">, runAt: Date): Promise<void>;

  /** Moves job `id` to the dead-letter queue, keeping `error` as its last failure. */
  abstract deadLetter(id: PublicId<"job">, error: JobError): Promise<void>;

  /** Deletes job `id`: it finished, or failed for good without a dead letter. */
  abstract remove(id: PublicId<"job">): Promise<void>;

  /** Up to `limit` dead-lettered jobs of `queue` (of every queue when `undefined`), in the order they were queued. */
  abstract deadLetters(queue: string | undefined, limit: number): Promise<readonly QueuedJob[]>;

  /**
   * Makes dead job `id` wait again from `now` with its attempts reset; `false` when it is not dead, or a waiting or
   * running job holds its `uniqueKey`.
   */
  abstract redrive(id: PublicId<"job">, now: Date): Promise<boolean>;

  /** Stores `batch` before its jobs are pushed. */
  abstract openBatch(batch: JobBatch): Promise<void>;

  /** Counts one job of batch `id` as done, or failed for good when `failed`; the batch after it, if stored. */
  abstract settleBatch(id: string, failed: boolean): Promise<JobBatch | undefined>;

  /** Batch `id`, if stored. */
  abstract batch(id: string): Promise<JobBatch | undefined>;
}
