/**
 * Stackra file contract:
 * Purpose: `QueueService`, how a job enters the queue and how a dead letter leaves it: `push` stores one run of an
 *          action on its declared queue (skipped while a unique job of the same scope waits or runs), `deadLetters`
 *          lists the jobs that failed for good, and `redrive` queues one of them again.
 * Boundary: a platform service over the `QueueDriver` port and the `Clock`; it runs nothing (the worker does). The
 *           callers are the `JobDispatcher` driver behind `ctx.dispatch`, a transport that received a queued call
 *           (`Prefer: respond-async`, sent by @stackra/clients' `queue(...)`), and the scheduler. A unique job is
 *           unique per scope: the scope's id, else the scope the caller acts in, else platform-wide.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: unique jobs, the dead-letter queue with replay); ADR 0305 (rule 28);
 *                     ADR 0260 (decision 4: queued calls); ADR 0098; ADR 0327 and ADR 0323 (`ScopeRef`).
 */
import type { Action, CallInput } from "@stackra/actions";
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { Clock, PublicId } from "@stackra/contracts";

import { JobStatus } from "#contracts/index";
import type { QueuedJob, QueueDriver } from "#contracts/index";
import { JOB_DEFAULTS } from "#core/constants/job-defaults.constant";
import { mintJobId } from "#core/functions/mint-job-id.function";
import { readJob } from "#core/functions/read-job.function";
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
    const plan = readJob(type);
    const { origin, scope, idempotencyKey, causedBy } = options;
    if (!plan.declared && origin === undefined)
      throw new TypeError(
        `${type.name} declares no job option, so a queued call of it needs the caller as origin`,
      );
    const job: QueuedJob = {
      id: mintJobId(),
      queue: plan.queue,
      key: plan.key,
      input,
      ...(origin === undefined ? {} : { origin }),
      ...(scope === undefined ? {} : { scope: { id: scope.id, path: scope.path } }),
      ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
      ...(plan.unique ? { uniqueKey: `${plan.key}:${scope?.id ?? origin?.scopeId ?? "-"}` } : {}),
      ...(causedBy === undefined ? {} : { causedBy }),
      status: JobStatus.Waiting,
      attempts: 0,
      runAt: this.clock.now(),
      lease: Duration.seconds(
        (Duration.toMilliseconds(plan.timeout) + Duration.toMilliseconds(JOB_DEFAULTS.leaseGrace)) /
          1000,
      ),
    };
    return (await this.driver.push(job)) ? job.id : undefined;
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
}
