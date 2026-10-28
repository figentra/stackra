/**
 * Stackra file contract:
 * Purpose: the memory driver of the `QueueDriver` port: jobs in process memory, reserved fairly (priority, then the
 *          scope with the fewest running jobs, then the oldest `runAt`, never past a scope's cap), a reservation held
 *          until its lease ends, unique keys checked against the waiting and running jobs, batches counted in memory.
 * Boundary: one process only and nothing survives a restart: tests and a single-process deployment. The input is stored
 *           as JSON, as the Postgres driver stores it, so a test sees what a worker in another process would. It reads
 *           no clock: the worker passes `now`.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1, 2 and 3); ADR 0266 (memory drivers first); ADR 0142 (drivers behind ports).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

import { JobStatus, QueueDriver } from "#contracts/index";
import type { JobBatch, JobError, QueuedJob } from "#contracts/index";

/** A stored job and, while it runs, the instant in epoch milliseconds its reservation lapses. */
type Slot = { readonly job: QueuedJob; readonly lockedUntil: number | undefined };

/** The fairness key of a job: its queue and scope (`-` for a platform job). */
function scopeKeyOf(job: QueuedJob): string {
  return `${job.queue}\u0000${job.scope?.id ?? "-"}`;
}

/** Whether job `a` (its scope running `loadA` jobs) is reserved before job `b`: priority, scope load, `runAt`, id. */
function before(a: QueuedJob, loadA: number, b: QueuedJob, loadB: number): boolean {
  const priority = (b.priority ?? 0) - (a.priority ?? 0);
  if (priority !== 0) return priority < 0;
  if (loadA !== loadB) return loadA < loadB;
  const time = a.runAt.getTime() - b.runAt.getTime();
  return time === 0 ? a.id < b.id : time < 0;
}

/**
 * Keeps jobs in process memory.
 *
 * @example
 * export class QueueConfig extends BaseQueueConfig {
 *   override driver: DriverName<QueueDriver> = "memory";
 * }
 */
export class MemoryQueueDriver extends Driver(QueueDriver) {
  /** Job id to its slot, in the order the jobs were queued. */
  private readonly slots = new Map<string, Slot>();

  /** Batch id to its progress. */
  private readonly batches = new Map<string, JobBatch>();

  /** Stores `job` as waiting; `false` when a live job holds its `uniqueKey`. */
  push(job: QueuedJob): Promise<boolean> {
    if (job.uniqueKey !== undefined && this.holds(job.uniqueKey, job.id))
      return Promise.resolve(false);
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
    const input: unknown = JSON.parse(JSON.stringify(job.input ?? null));
    this.slots.set(job.id, { job: Object.freeze({ ...job, input }), lockedUntil: undefined });
    return Promise.resolve(true);
  }

  /** Reserves the next due job of `queue`, as `QueueDriver.reserve` describes. */
  reserve(queue: string | undefined, now: Date): Promise<QueuedJob | undefined> {
    const at = now.getTime();
    const running = this.runningByScope(at);
    let next: { readonly job: QueuedJob; readonly load: number } | undefined;
    for (const { job, lockedUntil } of this.slots.values()) {
      if (queue !== undefined && job.queue !== queue) continue;
      const due =
        job.status === JobStatus.Waiting
          ? job.runAt.getTime() <= at
          : job.status === JobStatus.Running && (lockedUntil ?? 0) <= at;
      if (!due) continue;
      const load = running.get(scopeKeyOf(job)) ?? 0;
      if (job.scopeConcurrency !== undefined && load >= job.scopeConcurrency) continue;
      if (next === undefined || before(job, load, next.job, next.load)) next = { job, load };
    }
    if (next === undefined) return Promise.resolve(undefined);
    const reserved: QueuedJob = Object.freeze({
      ...next.job,
      status: JobStatus.Running,
      attempts: next.job.attempts + 1,
    });
    this.slots.set(reserved.id, {
      job: reserved,
      lockedUntil: at + Duration.toMilliseconds(reserved.lease),
    });
    return Promise.resolve(reserved);
  }

  /** Makes job `id` wait again until `runAt`, keeping `error`. */
  retry(id: PublicId<"job">, runAt: Date, error: JobError): Promise<void> {
    this.update(id, { status: JobStatus.Waiting, runAt, lastError: error });
    return Promise.resolve();
  }

  /** Makes running job `id` wait again until `runAt`, giving back the attempt its reservation took. */
  release(id: PublicId<"job">, runAt: Date): Promise<void> {
    const job = this.slots.get(id)?.job;
    if (job !== undefined)
      this.update(id, {
        status: JobStatus.Waiting,
        runAt,
        attempts: Math.max(0, job.attempts - 1),
      });
    return Promise.resolve();
  }

  /** Moves job `id` to the dead letters, keeping `error`. */
  deadLetter(id: PublicId<"job">, error: JobError): Promise<void> {
    this.update(id, { status: JobStatus.Dead, lastError: error });
    return Promise.resolve();
  }

  /** Deletes job `id` once it is done. */
  remove(id: PublicId<"job">): Promise<void> {
    this.slots.delete(id);
    return Promise.resolve();
  }

  /** Lists up to `limit` dead-lettered jobs of `queue`, oldest first. */
  deadLetters(queue: string | undefined, limit: number): Promise<readonly QueuedJob[]> {
    const dead = [...this.slots.values()]
      .map((slot) => slot.job)
      .filter(
        (job) => job.status === JobStatus.Dead && (queue === undefined || job.queue === queue),
      );
    return Promise.resolve(dead.slice(0, limit));
  }

  /** Makes dead job `id` wait again from `now`; `false` when it cannot. */
  redrive(id: PublicId<"job">, now: Date): Promise<boolean> {
    const job = this.slots.get(id)?.job;
    if (job?.status !== JobStatus.Dead) return Promise.resolve(false);
    if (job.uniqueKey !== undefined && this.holds(job.uniqueKey, id)) return Promise.resolve(false);
    this.update(id, { status: JobStatus.Waiting, attempts: 0, runAt: now });
    return Promise.resolve(true);
  }

  /** Stores `batch` in memory. */
  openBatch(batch: JobBatch): Promise<void> {
    this.batches.set(batch.id, Object.freeze({ ...batch }));
    return Promise.resolve();
  }

  /** Counts one job of batch `id` as done or failed. */
  settleBatch(id: string, failed: boolean): Promise<JobBatch | undefined> {
    const batch = this.batches.get(id);
    if (batch === undefined) return Promise.resolve(undefined);
    const settled = Object.freeze({
      ...batch,
      ...(failed ? { failed: batch.failed + 1 } : { done: batch.done + 1 }),
    });
    this.batches.set(id, settled);
    return Promise.resolve(settled);
  }

  /** Batch `id`, if stored. */
  batch(id: string): Promise<JobBatch | undefined> {
    return Promise.resolve(this.batches.get(id));
  }

  /** Running jobs whose reservation holds at `at`, counted per queue and scope. */
  private runningByScope(at: number): Map<string, number> {
    const running = new Map<string, number>();
    for (const { job, lockedUntil } of this.slots.values())
      if (job.status === JobStatus.Running && (lockedUntil ?? 0) > at) {
        const key = scopeKeyOf(job);
        running.set(key, (running.get(key) ?? 0) + 1);
      }
    return running;
  }

  /** Whether a waiting or running job other than `except` holds `uniqueKey`. */
  private holds(uniqueKey: string, except: string): boolean {
    for (const { job } of this.slots.values())
      if (job.id !== except && job.uniqueKey === uniqueKey && job.status !== JobStatus.Dead)
        return true;
    return false;
  }

  /** Replaces fields of job `id` and ends its reservation; a job no longer stored is left alone. */
  private update(id: string, fields: Partial<QueuedJob>): void {
    const slot = this.slots.get(id);
    if (slot !== undefined)
      this.slots.set(id, {
        job: Object.freeze({ ...slot.job, ...fields }),
        lockedUntil: undefined,
      });
  }
}
