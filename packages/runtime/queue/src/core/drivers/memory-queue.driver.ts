/**
 * Stackra file contract:
 * Purpose: the memory driver of the `QueueDriver` port: jobs in process memory, reserved oldest `runAt` first, a
 *          reservation held until its lease ends, unique keys checked against the waiting and running jobs.
 * Boundary: one process only and nothing survives a restart: tests and a single-process deployment. The input is stored
 *           as JSON, as the Postgres driver stores it, so a test sees what a worker in another process would. It reads
 *           no clock: the worker passes `now`.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1 and 3); ADR 0266 (memory drivers first); ADR 0142 (drivers behind ports).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

import { JobStatus, QueueDriver } from "#contracts/index";
import type { JobError, QueuedJob } from "#contracts/index";

/** A stored job and, while it runs, the instant in epoch milliseconds its reservation lapses. */
type Slot = { readonly job: QueuedJob; readonly lockedUntil: number | undefined };

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

  /** See `QueueDriver.push`. */
  push(job: QueuedJob): Promise<boolean> {
    if (job.uniqueKey !== undefined && this.holds(job.uniqueKey, job.id))
      return Promise.resolve(false);
    const input: unknown = JSON.parse(JSON.stringify(job.input ?? null));
    this.slots.set(job.id, { job: Object.freeze({ ...job, input }), lockedUntil: undefined });
    return Promise.resolve(true);
  }

  /** See `QueueDriver.reserve`. */
  reserve(queue: string | undefined, now: Date): Promise<QueuedJob | undefined> {
    const at = now.getTime();
    let next: QueuedJob | undefined;
    for (const { job, lockedUntil } of this.slots.values()) {
      if (queue !== undefined && job.queue !== queue) continue;
      const due =
        job.status === JobStatus.Waiting
          ? job.runAt.getTime() <= at
          : job.status === JobStatus.Running && (lockedUntil ?? 0) <= at;
      if (due && (next === undefined || job.runAt.getTime() < next.runAt.getTime())) next = job;
    }
    if (next === undefined) return Promise.resolve(undefined);
    const reserved: QueuedJob = Object.freeze({
      ...next,
      status: JobStatus.Running,
      attempts: next.attempts + 1,
    });
    this.slots.set(reserved.id, {
      job: reserved,
      lockedUntil: at + Duration.toMilliseconds(reserved.lease),
    });
    return Promise.resolve(reserved);
  }

  /** See `QueueDriver.retry`. */
  retry(id: PublicId<"job">, runAt: Date, error: JobError): Promise<void> {
    this.update(id, { status: JobStatus.Waiting, runAt, lastError: error });
    return Promise.resolve();
  }

  /** See `QueueDriver.deadLetter`. */
  deadLetter(id: PublicId<"job">, error: JobError): Promise<void> {
    this.update(id, { status: JobStatus.Dead, lastError: error });
    return Promise.resolve();
  }

  /** See `QueueDriver.remove`. */
  remove(id: PublicId<"job">): Promise<void> {
    this.slots.delete(id);
    return Promise.resolve();
  }

  /** See `QueueDriver.deadLetters`. */
  deadLetters(queue: string | undefined, limit: number): Promise<readonly QueuedJob[]> {
    const dead = [...this.slots.values()]
      .map((slot) => slot.job)
      .filter(
        (job) => job.status === JobStatus.Dead && (queue === undefined || job.queue === queue),
      );
    return Promise.resolve(dead.slice(0, limit));
  }

  /** See `QueueDriver.redrive`. */
  redrive(id: PublicId<"job">, now: Date): Promise<boolean> {
    const job = this.slots.get(id)?.job;
    if (job?.status !== JobStatus.Dead) return Promise.resolve(false);
    if (job.uniqueKey !== undefined && this.holds(job.uniqueKey, id)) return Promise.resolve(false);
    this.update(id, { status: JobStatus.Waiting, attempts: 0, runAt: now });
    return Promise.resolve(true);
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
