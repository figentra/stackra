/**
 * Stackra file contract:
 * Purpose: `LockLease`, a held lock: its keys, who took it and its fencing token. `Locks` hands it to the work it runs
 *          under the lock; a driver makes it and reads it back to renew and release.
 * Boundary: a type only, plain data. The token is the fencing rule of ADR 0149: larger than every earlier lease's on
 *           the same key, so a store that keeps the last token it saw refuses a write that carries a smaller one.
 * Runtime: isomorphic
 * Governing contract: ADR 0149 (decisions 2 and 3); ADR 0103 (decision 1).
 */

/**
 * A held lock.
 *
 * @example
 * await locks.with(Job.lockKey(job.id), Duration.minutes(1), async (lease) => {
 *   await jobs.finish(job.id, { fencingToken: lease.token });
 * });
 */
export interface LockLease {
  /** The keys it holds, sorted, each once. */
  readonly keys: readonly string[];

  /** The id of the `Locks` that took it, one per process. */
  readonly owner: string;

  /** The fencing token: larger than every earlier lease's on any of these keys. */
  readonly token: number;
}
