/**
 * Stackra file contract:
 * Purpose: `QueueWorkerService`, the runtime of a job: it reserves due jobs, runs each attempt through the action
 *          pipeline as the job's actor inside the job's scope session (and with it as the call's scope, so the handler
 *          reads `ctx.scope`) with its timeout, then removes the job, retries it after its backoff, dead-letters it
 *          (and calls the action's `onDeadLetter` method once), or drops it.
 * Boundary: a platform service over the `QueueDriver` port and the `Clock`; `connect(container)` gives it the
 *           container whose pipeline runs the actions (the runtime and the testing module call it, as they call
 *           `EventBus.connect`). A job of an action with a `job` option runs as a `job` actor when the action lists
 *           `ActorKind.Job`, else as the `system` actor, on behalf of the caller that queued it; a queued call of any
 *           other action runs as its caller. A refusal that is not retryable ends the job at once; any other error, a
 *           timeout included, is retried while attempts remain. A job whose key this process does not know is
 *           dead-lettered at once. Every attempt carries an Idempotency-Key (the queued call's, else one derived from
 *           the job when a store is bound), so an attempt that ran but was not recorded replays instead of running
 *           twice. The timeout aborts the attempt's signal; code that ignores the signal keeps running unobserved.
 * Runtime: node
 * Governing contract: ADR 0148 (decisions 1 and 3); ADR 0305 (rules 28 and 30); ADR 0138 (as amended: the pipeline);
 *                     ADR 0136 (decision 3: jobs derive their Idempotency-Keys); ADR 0260 (decision 4); ADR 0327
 *                     (decisions 6 and 9: the call's scope, the scope session).
 */
import { ActionPipeline } from "@stackra/actions";
import type { Action, Resolver } from "@stackra/actions";
import { IdempotencyStore, UnitOfWork } from "@stackra/actions/contracts";
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { backoffDelay, Duration, Logger } from "@stackra/contracts";
import type { Actor, Clock } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { isRefusal } from "@stackra/errors";

import type { QueueDriver, JobError, QueuedJob } from "#contracts/index";
import { JOB_BACKOFF } from "#core/constants/job-backoff.constant";
import { JOB_DEFAULTS } from "#core/constants/job-defaults.constant";
import { JOB_TYPES } from "#core/constants/job-types.constant";
import { QUEUE_LOG_EVENTS } from "#core/constants/queue-log-events.constant";
import { JobOutcome } from "#core/enums/job-outcome.enum";
import { JobTimedOutError } from "#core/errors/job-timed-out.error";
import { UnknownJobError } from "#core/errors/unknown-job.error";
import { readJob } from "#core/functions/read-job.function";
import type { JobPlan } from "#core/types/job-plan.type";
import type { JobRun } from "#core/types/job-run.type";

/** The connected container and the pipeline over it. */
interface Connection {
  readonly resolver: Resolver;
  readonly pipeline: ActionPipeline;
}

/**
 * Reserves and runs queued jobs through the action pipeline.
 *
 * @example
 * worker.connect(container);
 * await worker.work(Queues.Maintenance, { concurrency: 4, signal: shutdown.signal });
 */
export class QueueWorkerService extends Service {
  /** Where jobs are stored. */
  private readonly driver: QueueDriver;

  /** Reads "now" for a reservation and a retry. */
  private readonly clock: Clock;

  /** Set by `connect`. */
  private connection: Connection | undefined;

  /**
   * @param driver - the job store.
   * @param clock - the time source of reservations and retries.
   */
  constructor(driver: QueueDriver, clock: Clock) {
    super();
    this.driver = driver;
    this.clock = clock;
  }

  /** Runs jobs on the pipeline of `resolver` (a booted container or a testing app); a later call replaces it. */
  connect(resolver: Resolver): void {
    this.connection = { resolver, pipeline: new ActionPipeline(resolver) };
  }

  /**
   * Runs one attempt of `job`, which the caller reserved or a broker delivered (the driver's `claim` marks a delivered
   * job running), and records how it ended.
   *
   * @throws Error before `connect`; a driver's error when the outcome cannot be recorded; `JobNotDueError` from the
   *         `broker` driver for a job delivered before its `runAt`, so the broker delivers it again.
   */
  async process(job: QueuedJob): Promise<JobRun> {
    const now = this.clock.now();
    return this.run(await this.driver.claim(job, now), now);
  }

  /**
   * Reserves and runs the due jobs of `queue` (of every queue when absent), one at a time, until none is due.
   *
   * @param at - the instant to drain at instead of the clock's, so a test runs a retry without waiting for it.
   * @returns every attempt made, in order.
   * @throws Error before `connect`; a driver's error.
   */
  async drain(queue?: string, at?: Date): Promise<readonly JobRun[]> {
    this.connected();
    const runs: JobRun[] = [];
    for (;;) {
      const now = at ?? this.clock.now();
      // oxlint-disable-next-line no-await-in-loop -- one job at a time, each reserved after the last is recorded
      const job = await this.driver.reserve(queue, now);
      if (job === undefined) return runs;
      // oxlint-disable-next-line no-await-in-loop -- see above
      runs.push(await this.run(job, now));
    }
  }

  /**
   * Works `queue` with `concurrency` loops (one when absent) until `signal` aborts: each reserves the next due job and
   * runs it, and waits a second when none is due. A store that fails is logged and retried after the same pause.
   *
   * @throws Error before `connect`.
   * @throws RangeError when `concurrency` is not a whole number from 1.
   */
  async work(
    queue: string,
    options: { readonly signal: AbortSignal; readonly concurrency?: number },
  ): Promise<void> {
    const concurrency = options.concurrency ?? 1;
    if (!Number.isInteger(concurrency) || concurrency < 1)
      throw new RangeError(`concurrency is a whole number from 1, got ${concurrency}`);
    this.connected();
    await Promise.all(Array.from({ length: concurrency }, () => this.loop(queue, options.signal)));
  }

  /** One worker loop. */
  private async loop(queue: string, signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      try {
        const now = this.clock.now();
        // oxlint-disable-next-line no-await-in-loop -- a loop works one job at a time
        const job = await this.driver.reserve(queue, now);
        // oxlint-disable-next-line no-await-in-loop -- see above
        await (job === undefined ? this.pause(signal) : this.run(job, now));
      } catch (cause) {
        this.logger()?.error(QUEUE_LOG_EVENTS.workerFailed, { queue, cause });
        // oxlint-disable-next-line no-await-in-loop -- see above
        await this.pause(signal);
      }
    }
  }

  /** Resolves after the poll interval, or at once when `signal` aborts. */
  private pause(signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }
      const done = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", done);
        resolve();
      };
      const timer = setTimeout(done, Duration.toMilliseconds(JOB_DEFAULTS.pollInterval));
      signal.addEventListener("abort", done, { once: true });
    });
  }

  /** Runs one attempt of a reserved job at `now` and records its outcome. */
  private async run(job: QueuedJob, now: Date): Promise<JobRun> {
    this.connected();
    const found = this.resolve(job);
    if ("error" in found) {
      await this.driver.deadLetter(job.id, this.failureOf(found.error));
      return Object.freeze({ job, outcome: JobOutcome.DeadLettered, error: found.error });
    }
    const { type, plan } = found;
    try {
      const output = await this.inScope(job, () => this.attempt(type, plan, job));
      await this.driver.remove(job.id);
      return Object.freeze({ job, outcome: JobOutcome.Done, output });
    } catch (error) {
      return this.failed(type, plan, job, now, error);
    }
  }

  /** The action class and plan of `job`, or why there is none. */
  private resolve(
    job: QueuedJob,
  ): { readonly type: AnyClass<Action>; readonly plan: JobPlan } | { readonly error: unknown } {
    const type = JOB_TYPES.byKey.get(job.key);
    if (type === undefined) return { error: UnknownJobError.create({ key: job.key }) };
    try {
      return { type, plan: readJob(type) };
    } catch (error) {
      return { error };
    }
  }

  /** One attempt through the pipeline, refused with `JobTimedOutError` when it runs past the plan's timeout. */
  private async attempt(type: AnyClass<Action>, plan: JobPlan, job: QueuedJob): Promise<unknown> {
    const { resolver, pipeline } = this.connected();
    const idempotencyKey =
      job.idempotencyKey ?? (resolver.has(IdempotencyStore) ? `job:${job.id}` : undefined);
    const controller = new AbortController();
    const call = pipeline.execute(type, job.input as never, {
      actor: this.actorOf(plan, job),
      ...(job.scope === undefined ? {} : { scope: job.scope }),
      ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
      abortSignal: controller.signal,
    });
    // A call that outlives its timeout settles unobserved.
    call.catch(() => undefined);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const expired = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(JobTimedOutError.create({ timeout: plan.timeout }));
      }, Duration.toMilliseconds(plan.timeout));
    });
    try {
      return await Promise.race([call, expired]);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Records a failed attempt: a retry while attempts remain, else the dead letter or the drop. */
  private async failed(
    type: AnyClass<Action>,
    plan: JobPlan,
    job: QueuedJob,
    now: Date,
    error: unknown,
  ): Promise<JobRun> {
    const failure = this.failureOf(error);
    const retryable = !isRefusal(error) || error.retryable;
    if (retryable && job.attempts <= plan.retries) {
      const retryAt = new Date(
        now.getTime() + backoffDelay({ ...JOB_BACKOFF, backoff: plan.backoff }, job.attempts),
      );
      await this.driver.retry(job.id, retryAt, failure);
      return Object.freeze({ job, outcome: JobOutcome.Retried, error, retryAt });
    }
    if (plan.deadLetter) {
      await this.driver.deadLetter(job.id, failure);
      await this.afterDeadLetter(type, plan, job);
      return Object.freeze({ job, outcome: JobOutcome.DeadLettered, error });
    }
    await this.driver.remove(job.id);
    this.logger()?.error(QUEUE_LOG_EVENTS.jobDropped, {
      jobId: job.id,
      key: job.key,
      attempts: job.attempts,
      cause: error,
    });
    return Object.freeze({ job, outcome: JobOutcome.Dropped, error });
  }

  /** Calls the action's `onDeadLetter` method once with the job's input, in its scope and unit of work. */
  private async afterDeadLetter(
    type: AnyClass<Action>,
    plan: JobPlan,
    job: QueuedJob,
  ): Promise<void> {
    const name = plan.onDeadLetter;
    if (name === undefined) return;
    const { resolver } = this.connected();
    try {
      const instance = resolver.get(type) as unknown as Readonly<
        Record<string, (input: unknown) => unknown>
      >;
      const hook = async () => {
        await instance[name]?.(job.input);
      };
      const unit = resolver.has(UnitOfWork) ? resolver.get(UnitOfWork) : undefined;
      await this.inScope(job, () => (unit === undefined ? hook() : unit.transaction(hook)));
    } catch (cause) {
      this.logger()?.error(QUEUE_LOG_EVENTS.deadLetterHookFailed, {
        jobId: job.id,
        key: job.key,
        cause,
      });
    }
  }

  /** The actor an attempt runs as. */
  private actorOf(plan: JobPlan, job: QueuedJob): Actor {
    const { origin } = job;
    if (!plan.declared && origin !== undefined) return origin;
    return Object.freeze({
      kind: plan.actor,
      id: job.id,
      ...(origin?.scopeId === undefined ? {} : { scopeId: origin.scopeId }),
      ...(origin === undefined ? {} : { onBehalfOf: origin }),
    });
  }

  /** Runs `work` in the job's scope session, or as it is for a platform job. */
  private inScope<T>(job: QueuedJob, work: () => Promise<T>): Promise<T> {
    return job.scope === undefined ? work() : Database.current().withScope(job.scope, work);
  }

  /** What a stored job keeps of `error`. */
  private failureOf(error: unknown): JobError {
    return {
      code: isRefusal(error) ? error.code : "internal",
      message: error instanceof Error ? error.message : String(error),
    };
  }

  /** The bound logger, when there is one. */
  private logger(): Logger | undefined {
    const resolver = this.connection?.resolver;
    return resolver?.has(Logger) === true ? resolver.get(Logger) : undefined;
  }

  /**
   * The connection.
   *
   * @throws Error before `connect`.
   */
  private connected(): Connection {
    if (this.connection === undefined)
      throw new Error("QueueWorkerService is not connected: call worker.connect(container) first");
    return this.connection;
  }
}
