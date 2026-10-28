/**
 * Stackra file contract:
 * Purpose: `QueueService`, how a job enters the queue and how a dead letter leaves it: `push` stores one run of an
 *          action on its declared queue (skipped while a unique job of the same scope waits or runs), `chain` queues
 *          runs that follow each other, `batch` queues a group whose `progress` it reads, `deadLetters` lists the jobs
 *          that failed for good, and `redrive` queues one of them again.
 * Boundary: a platform service over the `QueueDriver` port and the `Clock`; it runs nothing (the worker does). The
 *           callers are the `JobDispatcher` driver behind `ctx.dispatch`, a transport that received a queued call
 *           (`Prefer: respond-async`, sent by @stackra/clients' `queue(...)`), and the scheduler. A unique job is
 *           unique per scope: the scope's id, else the scope the caller acts in, else platform-wide.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1 and 2: unique jobs, batches, chains, priority, the dead-letter queue with
 *                     replay); ADR 0305 (rule 28);
 *                     ADR 0260 (decision 4: queued calls); ADR 0098; ADR 0327 and ADR 0323 (`ScopeRef`).
 */
import type { Action, CallInput } from "@stackra/actions";
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Clock, PublicId } from "@stackra/contracts";

import type { JobBatch, QueuedJob, QueueDriver } from "#contracts/index";
import { buildJob } from "#core/functions/build-job.function";
import { mintJobId } from "#core/functions/mint-job-id.function";
import { readJob } from "#core/functions/read-job.function";
import type { JobLink } from "#core/types/job-link.type";
import type { JobPlan } from "#core/types/job-plan.type";
import type { PushOptions } from "#core/types/push-options.type";

/**
 * Queues jobs and redrives dead letters.
 *
 * @example
 * await queue.push(ExpireUnpaidOrdersAction, { batchSize: 100 }, { scope });
 * for (const job of await queue.deadLetters(Queues.Delivery)) await queue.redrive(job.id);
 */
export class QueueService extends Service {
  /** Where jobs are stored. */
  private readonly driver: QueueDriver;

  /** Reads when a job is due. */
  private readonly clock: Clock;

  /**
   * @param driver - the job store.
   * @param clock - the time a job is queued at and redriven at.
   */
  constructor(driver: QueueDriver, clock: Clock) {
    super();
    this.driver = driver;
    this.clock = clock;
  }

  /**
   * Stores one run of `type` with `input`, due now.
   *
   * @returns the job's id, or `undefined` when a unique job of the same scope already waits or runs.
   * @throws TypeError when `type` is not an action, or declares no `job` option and `options.origin` is absent.
   */
  async push<C extends AnyClass<Action>>(
    type: C,
    input: CallInput<InstanceType<C>>,
    options: PushOptions = {},
  ): Promise<PublicId<"job"> | undefined> {
    const plan = this.planOf({ type, input }, options);
    this.checkPriority(options);
    const job = buildJob(plan, input, options, this.clock.now());
    return (await this.driver.push(job)) ? job.id : undefined;
  }

  /**
   * Queues `links` to run one after another: the first now, each next one once the one before it is done, all with
   * the same `options`. A link that fails for good stops the chain; its dead letter keeps the rest, so a redrive
   * resumes it.
   *
   * @returns the first job's id, or `undefined` when a unique job of the same scope already waits or runs.
   * @throws TypeError when `links` is empty, or a link's type is not an action or needs an origin it lacks.
   */
  async chain(
    links: readonly JobLink[],
    options: PushOptions = {},
  ): Promise<PublicId<"job"> | undefined> {
    const [first, ...rest] = links;
    if (first === undefined) throw new TypeError("A job chain needs at least one link");
    const plan = this.planOf(first, options);
    const chain = rest.map((link) => ({ key: this.planOf(link, options).key, input: link.input }));
    this.checkPriority(options);
    const job = buildJob(plan, first.input, options, this.clock.now(), { chain });
    return (await this.driver.push(job)) ? job.id : undefined;
  }

  /**
   * Queues `links` as one batch whose progress `progress` reads. A link skipped because a unique job of the same
   * scope already waits or runs counts as done at once, so the batch still finishes.
   *
   * @returns the batch id and the id of each queued job, in order (`undefined` for a skipped one).
   * @throws TypeError when `links` is empty, or a link's type is not an action or needs an origin it lacks.
   */
  async batch(
    links: readonly JobLink[],
    options: PushOptions = {},
  ): Promise<{ readonly id: string; readonly jobs: readonly (PublicId<"job"> | undefined)[] }> {
    if (links.length === 0) throw new TypeError("A job batch needs at least one job");
    const planned = links.map((link) => ({ link, plan: this.planOf(link, options) }));
    this.checkPriority(options);
    const id = `jbt_${mintJobId().slice("job_".length)}`;
    await this.driver.openBatch({ id, total: links.length, done: 0, failed: 0 });
    const now = this.clock.now();
    const jobs: (PublicId<"job"> | undefined)[] = [];
    for (const { link, plan } of planned) {
      const job = buildJob(plan, link.input, options, now, { batchId: id });
      if (await this.driver.push(job)) jobs.push(job.id);
      else {
        jobs.push(undefined);
        await this.driver.settleBatch(id, false);
      }
    }
    return Object.freeze({ id, jobs: Object.freeze(jobs) });
  }

  /** The progress of batch `id`: its total, done and failed counts; `undefined` when no such batch is stored. */
  progress(id: string): Promise<JobBatch | undefined> {
    return this.driver.batch(id);
  }

  /** Up to `limit` dead-lettered jobs of `queue` (of every queue when absent), in the order they were queued. */
  deadLetters(queue?: string, limit = 100): Promise<readonly QueuedJob[]> {
    return this.driver.deadLetters(queue, limit);
  }

  /**
   * Queues dead job `id` again, due now, with all its attempts.
   *
   * @returns `false` when it is not dead, or a unique job of the same scope waits or runs.
   */
  redrive(id: PublicId<"job">): Promise<boolean> {
    return this.driver.redrive(id, this.clock.now());
  }

  /**
   * The plan of `link`.
   *
   * @throws TypeError when it is not an action, or declares no `job` option and `options.origin` is absent.
   */
  private planOf(link: JobLink, options: PushOptions): JobPlan {
    const plan = readJob(link.type);
    if (!plan.declared && options.origin === undefined)
      throw new TypeError(
        `${link.type.name} declares no job option, so a queued call of it needs the caller as origin`,
      );
    return plan;
  }

  /**
   * Checks the priority of `options`.
   *
   * @throws RangeError when it is not a whole number.
   */
  private checkPriority(options: PushOptions): void {
    if (options.priority !== undefined && !Number.isInteger(options.priority))
      throw new RangeError(`priority is a whole number, got ${options.priority}`);
  }
}
