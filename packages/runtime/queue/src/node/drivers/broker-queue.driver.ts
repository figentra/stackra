/**
 * Stackra file contract:
 * Purpose: the broker driver of the `QueueDriver` port (driver name `broker`): a job is published to its queue's broker
 *          topic (`queue.<queue>`, the Encore Pub/Sub topics `emitEncoreQueues` generates, through the `BrokerPublisher`)
 *          and runs when the generated subscription hands it to `QueueWorkerService.process`. A retry is published again
 *          with its new `runAt` (a throttled job too, with its attempt given back); a dead letter is kept in the
 *          service's `queue.jobs` table, where `deadLetters` and `redrive` find it, and batches in `queue.job_batches`.
 * Boundary: nothing is polled: `reserve` answers no job, the broker delivers. `claim` marks a delivered job running with
 *           one more attempt and holds it in this process until the worker records its outcome (the subscription
 *           handler runs both in one call); a job delivered before its `runAt` is refused `job_not_due`, so the broker
 *           delivers it again after its own retry backoff. Delivery is at least once: the worker's Idempotency-Key per
 *           job turns a repeat into a replay. A message is the job as JSON (`{ id, body }`); a retry's message id carries
 *           the attempt, so subscribers that deduplicate by id still see it. Priority and `scopeConcurrency` are not
 *           applied: the broker delivers in its own order (a Pub/Sub subscription's `maxConcurrency` caps a queue).
 * Runtime: node
 * Governing contract: ADR 0148 (decisions 1, 3 and 6: Encore Pub/Sub queues in SaaS, retries, dead letters);
 *                     ADR 0142 (drivers behind ports); ADR 0266 (decision 4.3: encore-pubsub); ADR 0136 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import { JobStatus, QueueDriver } from "#contracts/index";
import type { BrokerPublisher, JobBatch, JobError, QueuedJob } from "#contracts/index";
import { JobNotDueError } from "#core/errors/job-not-due.error";
import { PostgresQueueDriver } from "#node/drivers/postgres-queue.driver";

/** How many dead letters `redrive` scans for the id it was given. */
const REDRIVE_SCAN = 1000;

/**
 * Runs jobs from broker subscriptions.
 *
 * @example
 * // runway.yaml (SaaS): config.queue: { driver: broker, broker: { driver: topic } }
 * await queue.push(DeliverMessageAction, input); // published to queue.delivery; the subscription runs it
 */
export class BrokerQueueDriver extends Driver(QueueDriver) {
  /** Publishes each job to its queue's topic. */
  private readonly broker: BrokerPublisher;

  /** Keeps the dead letters. */
  private readonly store: QueueDriver;

  /** The delivered jobs this process is running, by id, until the worker records their outcome. */
  private readonly running = new Map<string, QueuedJob>();

  /**
   * @param broker - the publisher of the generated queue topics (`queue.broker.driver: topic` in SaaS).
   * @param database - the service's database, whose `queue.jobs` table keeps the dead letters.
   */
  constructor(broker: BrokerPublisher, database: Database) {
    super();
    this.broker = broker;
    this.store = new PostgresQueueDriver(database);
  }

  /**
   * Marks a delivered job running with one more attempt.
   *
   * @throws JobNotDueError when `job` is not due at `now`.
   */
  override claim(job: QueuedJob, now: Date): Promise<QueuedJob> {
    if (job.runAt.getTime() > now.getTime())
      return Promise.reject(JobNotDueError.create({ runAt: job.runAt.toISOString() }));
    const claimed: QueuedJob = Object.freeze({
      ...job,
      status: JobStatus.Running,
      attempts: job.attempts + 1,
    });
    this.running.set(claimed.id, claimed);
    return Promise.resolve(claimed);
  }

  /**
   * Publishes `job` to `queue.<queue>`; always `true`.
   *
   * shortcut: a broker holds no unique key, so a unique job pushed twice runs twice; hold the key in `queue.jobs` when a
   * product needs unique jobs on the broker.
   */
  async push(job: QueuedJob): Promise<boolean> {
    await this.publish(job, job.id);
    return true;
  }

  /** No job: the broker delivers each one to the generated subscription. */
  reserve(_queue: string | undefined, _now: Date): Promise<QueuedJob | undefined> {
    return Promise.resolve(undefined);
  }

  /**
   * Publishes running job `id` again, waiting until `runAt`, keeping `error`.
   *
   * @throws TypeError when this process is not running job `id`.
   */
  async retry(id: PublicId<"job">, runAt: Date, error: JobError): Promise<void> {
    const job = this.take(id);
    await this.publish(
      { ...job, status: JobStatus.Waiting, runAt, lastError: error },
      `${job.id}:${job.attempts}`,
    );
  }

  /**
   * Publishes running job `id` again, waiting until `runAt`, with the attempt its claim took given back.
   *
   * @throws TypeError when this process is not running job `id`.
   */
  async release(id: PublicId<"job">, runAt: Date): Promise<void> {
    const job = this.take(id);
    await this.publish(
      { ...job, status: JobStatus.Waiting, runAt, attempts: Math.max(0, job.attempts - 1) },
      `${job.id}:released:${runAt.getTime()}`,
    );
  }

  /**
   * Keeps running job `id` in `queue.jobs` as a dead letter, with `error`.
   *
   * @throws TypeError when this process is not running job `id`.
   */
  async deadLetter(id: PublicId<"job">, error: JobError): Promise<void> {
    const { uniqueKey: _held, ...job } = this.take(id);
    // The stored copy holds no unique key: on the broker none was held, and none may block the dead letter.
    await this.store.push({ ...job, status: JobStatus.Waiting });
    await this.store.deadLetter(id, error);
  }

  /** Forgets job `id` (the subscription acknowledges its message), or deletes it from `queue.jobs`. */
  async remove(id: PublicId<"job">): Promise<void> {
    if (!this.running.delete(id)) await this.store.remove(id);
  }

  /** Up to `limit` dead letters of `queue`, from `queue.jobs`. */
  deadLetters(queue: string | undefined, limit: number): Promise<readonly QueuedJob[]> {
    return this.store.deadLetters(queue, limit);
  }

  /**
   * Publishes dead job `id` again from `now` with its attempts reset, and deletes it from `queue.jobs`; `false` when it
   * is not dead.
   *
   * shortcut: scans the oldest 1000 dead letters for `id`; add a lookup by id to the store when a service keeps more.
   */
  async redrive(id: PublicId<"job">, now: Date): Promise<boolean> {
    const dead = (await this.store.deadLetters(undefined, REDRIVE_SCAN)).find(
      (job) => job.id === id,
    );
    if (dead === undefined) return false;
    await this.publish(
      { ...dead, status: JobStatus.Waiting, attempts: 0, runAt: now },
      `${id}:redrive:${now.getTime()}`,
    );
    await this.store.remove(id);
    return true;
  }

  /** Stores `batch` in `queue.job_batches`. */
  openBatch(batch: JobBatch): Promise<void> {
    return this.store.openBatch(batch);
  }

  /** Counts one job of batch `id` in `queue.job_batches`. */
  settleBatch(id: string, failed: boolean): Promise<JobBatch | undefined> {
    return this.store.settleBatch(id, failed);
  }

  /** Batch `id` from `queue.job_batches`. */
  batch(id: string): Promise<JobBatch | undefined> {
    return this.store.batch(id);
  }

  /** Hands `job` to its queue's topic under message id `messageId`. */
  private publish(job: QueuedJob, messageId: string): Promise<void> {
    return this.broker.publish(`queue.${job.queue}`, { id: messageId, body: job });
  }

  /**
   * Removes and answers running job `id`.
   *
   * @throws TypeError when this process is not running it.
   */
  private take(id: PublicId<"job">): QueuedJob {
    const job = this.running.get(id);
    if (job === undefined)
      throw new TypeError(`The broker queue driver is not running job ${id}: claim it first`);
    this.running.delete(id);
    return job;
  }
}
