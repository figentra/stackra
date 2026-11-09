/**
 * Stackra file contract:
 * Purpose: `QueueWorkerService`, the runtime of a job: it reserves due jobs, runs each attempt through the action
 *          pipeline as the job's actor inside the job's scope session (and with it as the call's scope, so the handler
 *          reads `ctx.scope`) with its timeout and its attempt (`ctx.attempt`: the number, and whether no retry
 *          follows), then removes the job, retries it after its backoff, dead-letters it
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
 *           A throttle counts in the bound `RateLimitStore` (bucket `queue.throttle:<key>`); a throttled job with no
 *           store bound fails its attempt rather than run unthrottled.
 *           With a `CallIsolation` bound (ADR 0495) the pipeline isolates each attempt as the job's actor in its scope,
 *           and the `onDeadLetter` hook runs in it too (a job stored with no actor runs as a platform call); with none
 *           bound a job with a scope is refused (`JobIsolationMissingError`, dead-lettered at once, since nothing could
 *           set its tenant) and a job with none runs as a platform call.
 *           Jobs are tenant-owned (ADR 0239 amendment, gaps A and C): a reservation claims a job's id and owner across
 *           owners, and the job is loaded, settled (removed, retried, released or dead-lettered) in that owner's
 *           isolation (`inJobOwner`); the next link of its chain is queued in a transaction of its own (`requiresNew`,
 *           with a `Database` bound) in that owner, so it takes the owner's tenant. A claimed job that does not load,
 *           or an owned one with no isolation bound, fails the reservation (`JobClaimNotLoadedError`,
 *           `JobRowIsolationMissingError`): it is never skipped, and runs again once its lease lapses. A job a broker
 *           delivered has no claimed row: its row work (a dead letter kept in the store) runs in its own scope's
 *           isolation, so it takes that scope's tenant.
 * Runtime: node
 * Governing contract: ADR 0495 (decision 2 and the note of 2026-11-01); ADR 0148 (decisions 1, 2 and 3); ADR 0305
 *                     (rules 28 and 30); ADR 0138 (as amended: the pipeline); ADR 0136 (decision 3: jobs derive their
 *                     Idempotency-Keys); ADR 0260 (decision 4); ADR 0327 (decisions 6 and 9: the call's scope, the
 *                     scope session); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import { ActionPipeline } from "@stackra/actions";
import type { Action, Resolver } from "@stackra/actions";
import {
  CallIsolation,
  IdempotencyStore,
  RateLimitStore,
  UnitOfWork,
} from "@stackra/actions/contracts";
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { actingScopeId, ActorKind, backoffDelay, Duration, Logger } from "@stackra/contracts";
import type { Actor, Clock } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { isRefusal } from "@stackra/errors";

import type { QueueDriver, JobClaim, JobError, QueuedJob } from "#contracts/index";
import { JOB_BACKOFF } from "#core/constants/job-backoff.constant";
import { JOB_DEFAULTS } from "#core/constants/job-defaults.constant";
import { JOB_TYPES } from "#core/constants/job-types.constant";
import { buildJob } from "#core/functions/build-job.function";
import { QUEUE_LOG_EVENTS } from "#core/constants/queue-log-events.constant";
import { JobOutcome } from "#core/enums/job-outcome.enum";
import { JobClaimNotLoadedError } from "#core/errors/job-claim-not-loaded.error";
import { JobIsolationMissingError } from "#core/errors/job-isolation-missing.error";
import { JobTimedOutError } from "#core/errors/job-timed-out.error";
import { UnknownJobError } from "#core/errors/unknown-job.error";
import { inJobOwner } from "#core/functions/in-job-owner.function";
import { readJob } from "#core/functions/read-job.function";
import type { JobPlan } from "#core/types/job-plan.type";
import type { JobRun } from "#core/types/job-run.type";

/** The actor a delivered job's row work runs as, in the job's scope: the worker's system actor. */
const WORKER_ACTOR: Actor = Object.freeze({ kind: ActorKind.System, id: "sys_queue_worker" });

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
    return this.run(await this.driver.claim(job, now), now, undefined);
  }

  /**
   * Reserves and runs the due jobs of `queue` (of every queue when absent), one at a time, until none is due.
   *
   * @param at - the instant to drain at instead of the clock's, so a test runs a retry without waiting for it.
   * @returns every attempt made, in order.
   * @throws Error before `connect`; a driver's error; `JobClaimNotLoadedError` or `JobRowIsolationMissingError` for a
   *         reserved job that cannot load in its owner.
   */
  async drain(queue?: string, at?: Date): Promise<readonly JobRun[]> {
    this.connected();
    const runs: JobRun[] = [];
    for (;;) {
      const run = await this.next(queue, at ?? this.clock.now());
      if (run === undefined) return runs;
      runs.push(run);
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
        if ((await this.next(queue, this.clock.now())) === undefined) await this.pause(signal);
      } catch (error) {
        this.logger()?.error(QUEUE_LOG_EVENTS.workerFailed, { queue, cause: error });
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

  /**
   * Reserves the next due job of `queue` at `now`, loads it in its owner and runs one attempt; `undefined` when none is
   * due.
   *
   * @throws JobClaimNotLoadedError when the reserved job does not load in its owner.
   * @throws JobRowIsolationMissingError when it has an owner and no `CallIsolation` is bound.
   */
  private async next(queue: string | undefined, now: Date): Promise<JobRun | undefined> {
    const claim = await this.driver.reserve(queue, now);
    if (claim === undefined) return undefined;
    const job = await inJobOwner(this.isolation(), claim.ownerId, claim.id, () =>
      this.driver.load(claim.id),
    );
    if (job === undefined) throw JobClaimNotLoadedError.create({ id: claim.id });
    return this.run(job, now, claim);
  }

  /** Runs one attempt of a reserved job at `now` (claimed, or delivered when `claim` is undefined) and records it. */
  private async run(job: QueuedJob, now: Date, claim: JobClaim | undefined): Promise<JobRun> {
    this.connected();
    const inOwner = <T>(work: () => Promise<T>) => this.inOwner(job, claim, work);
    const found = this.resolve(job);
    if ("error" in found) {
      await inOwner(() => this.driver.deadLetter(job.id, this.failureOf(found.error)));
      await this.settle(job, true);
      return Object.freeze({ job, outcome: JobOutcome.DeadLettered, error: found.error });
    }
    const { type, plan } = found;
    let output: unknown;
    try {
      const retryAt = await this.throttled(job, now);
      if (retryAt !== undefined) {
        await inOwner(() => this.driver.release(job.id, retryAt));
        return Object.freeze({ job, outcome: JobOutcome.Throttled, retryAt });
      }
      // With a `CallIsolation` bound the pipeline isolates the attempt itself (the job's actor and scope), and commits
      // once, so no outer scope session wraps it: one would hold the commit past the call's after-commit work.
      output = this.connected().resolver.has(CallIsolation)
        ? await this.attempt(type, plan, job)
        : await this.unisolated(job, () => this.attempt(type, plan, job));
      await inOwner(() => this.driver.remove(job.id));
    } catch (error) {
      return this.failed(type, plan, job, now, error, inOwner);
    }
    await this.followUp(job, claim);
    return Object.freeze({ job, outcome: JobOutcome.Done, output });
  }

  /**
   * When `job` has a throttle and its bucket has no token free at `now`: the instant the next one is; else takes one.
   *
   * @throws TypeError when the job has a throttle and no `RateLimitStore` is bound.
   */
  private async throttled(job: QueuedJob, now: Date): Promise<Date | undefined> {
    const { throttle } = job;
    if (throttle === undefined) return undefined;
    const { resolver } = this.connected();
    if (!resolver.has(RateLimitStore))
      throw new TypeError(
        `Job ${job.key} is throttled by "${throttle.key}" but no RateLimitStore is bound`,
      );
    const decision = await resolver
      .get(RateLimitStore)
      .take(
        `queue.throttle:${throttle.key}`,
        { capacity: throttle.perMinute, tokensPerSecond: throttle.perMinute / 60 },
        now,
      );
    return decision.allowed
      ? undefined
      : new Date(now.getTime() + Math.max(1, decision.retryAfterMs));
  }

  /**
   * After `job` is done: queues the next link of its chain in a transaction of its own in the job's owner, so the link
   * takes that owner's tenant, or counts it done in its batch at the chain's end.
   */
  private async followUp(job: QueuedJob, claim: JobClaim | undefined): Promise<void> {
    const [link, ...rest] = job.chain ?? [];
    if (link === undefined) {
      await this.settle(job, false);
      return;
    }
    const type = JOB_TYPES.byKey.get(link.key);
    // A key this process does not know is queued on the job's queue, where its worker dead-letters it as unknown.
    const plan =
      type === undefined
        ? {
            key: link.key,
            queue: job.queue,
            unique: false,
            timeout: JOB_DEFAULTS.timeout,
            priority: 0,
          }
        : readJob(type);
    const { origin, scope, causedBy } = job;
    const next = buildJob(
      plan,
      link.input,
      {
        ...(origin === undefined ? {} : { origin }),
        ...(scope === undefined ? {} : { scope }),
        ...(causedBy === undefined ? {} : { causedBy }),
      },
      this.clock.now(),
      { ...(job.batchId === undefined ? {} : { batchId: job.batchId }), chain: rest },
    );
    const { resolver } = this.connected();
    const push = () => this.inOwner(job, claim, () => this.driver.push(next));
    // A tenant insert from a no-tenant session: its own transaction, so no running transaction's tenant is replaced.
    await (resolver.has(Database)
      ? resolver.get(Database).transaction(push, { requiresNew: true })
      : push());
  }

  /**
   * Runs the row work of `job` in its owner: the claimed owner of a stored job (`inJobOwner`), or, for one a broker
   * delivered (no claim), the tenant of its own scope through the bound isolation (none bound: as it is).
   */
  private inOwner<T>(
    job: QueuedJob,
    claim: JobClaim | undefined,
    work: () => Promise<T>,
  ): Promise<T> {
    const isolation = this.isolation();
    if (claim !== undefined) return inJobOwner(isolation, claim.ownerId, claim.id, work);
    return isolation === undefined
      ? work()
      : isolation.run(WORKER_ACTOR, job.scope, () => work(), { readOnly: false });
  }

  /** The bound `CallIsolation`, if any. */
  private isolation(): CallIsolation | undefined {
    const { resolver } = this.connected();
    return resolver.has(CallIsolation) ? resolver.get(CallIsolation) : undefined;
  }

  /** Counts `job` in its batch, as failed for good when `failed`. */
  private async settle(job: QueuedJob, failed: boolean): Promise<void> {
    if (job.batchId !== undefined) await this.driver.settleBatch(job.batchId, failed);
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
      // the attempt counts this one; past the plan's retries a failure dead-letters the job
      attempt: { number: job.attempts, last: job.attempts > plan.retries },
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
    inOwner: <T>(work: () => Promise<T>) => Promise<T>,
  ): Promise<JobRun> {
    const failure = this.failureOf(error);
    const retryable = !isRefusal(error) || error.retryable;
    if (retryable && job.attempts <= plan.retries) {
      const retryAt = new Date(
        now.getTime() + backoffDelay({ ...JOB_BACKOFF, backoff: plan.backoff }, job.attempts),
      );
      await inOwner(() => this.driver.retry(job.id, retryAt, failure));
      return Object.freeze({ job, outcome: JobOutcome.Retried, error, retryAt });
    }
    if (plan.deadLetter) {
      await inOwner(() => this.driver.deadLetter(job.id, failure));
      await this.settle(job, true);
      await this.afterDeadLetter(type, plan, job);
      return Object.freeze({ job, outcome: JobOutcome.DeadLettered, error });
    }
    await inOwner(() => this.driver.remove(job.id));
    await this.settle(job, true);
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
      const work = () => (unit === undefined ? hook() : unit.transaction(hook));
      await (resolver.has(CallIsolation)
        ? resolver
            .get(CallIsolation)
            .run(this.actorOf(plan, job), job.scope, work, { readOnly: false })
        : this.unisolated(job, work));
    } catch (error) {
      this.logger()?.error(QUEUE_LOG_EVENTS.deadLetterHookFailed, {
        jobId: job.id,
        key: job.key,
        cause: error,
      });
    }
  }

  /** The actor an attempt runs as. */
  private actorOf(plan: JobPlan, job: QueuedJob): Actor {
    const { origin } = job;
    if (!plan.declared && origin !== undefined) return origin;
    const scopeId = origin === undefined ? undefined : actingScopeId(origin);
    return Object.freeze({
      kind: plan.actor,
      id: job.id,
      ...(scopeId === undefined ? {} : { scopeId }),
      ...(origin === undefined ? {} : { onBehalfOf: origin }),
    });
  }

  /**
   * Runs `work` as it is for a platform job; refuses a scoped one, since with no `CallIsolation` bound nothing sets its
   * tenant and a scope session alone would read zero rows of every tenant-owned table. The tenant rule lives in
   * `@stackra/tenancy`'s driver, so it is refused here rather than repeated.
   *
   * @throws JobIsolationMissingError when `job` has a scope.
   */
  private unisolated<T>(job: QueuedJob, work: () => Promise<T>): Promise<T> {
    if (job.scope !== undefined)
      return Promise.reject(JobIsolationMissingError.create({ key: job.key }));
    return work();
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
