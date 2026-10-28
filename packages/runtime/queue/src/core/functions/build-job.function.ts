/**
 * Stackra file contract:
 * Purpose: `buildJob`, the waiting `QueuedJob` of one run of an action: its plan's queue, key, unique key, lease and
 *          fairness (priority, scope cap, throttle), the caller's origin and scope, and the batch and chain it belongs to.
 * Boundary: internal to this package; `QueueService` builds the jobs it pushes with it, and the worker the next link
 *           of a chain. Pure: it mints an id and reads nothing else, the caller passes `now`. A field that is absent
 *           stays absent, so a stored job carries only what was set.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1 and 2); ADR 0305 (rule 28); ADR 0327 and ADR 0323 (`ScopeRef`).
 */
import { Duration } from "@stackra/contracts";

import { JobStatus } from "#contracts/index";
import type { QueuedJob } from "#contracts/index";
import { JOB_DEFAULTS } from "#core/constants/job-defaults.constant";
import { mintJobId } from "#core/functions/mint-job-id.function";
import type { JobPlacement } from "#core/types/job-placement.type";
import type { JobPlan } from "#core/types/job-plan.type";
import type { PushOptions } from "#core/types/push-options.type";

/**
 * A waiting job of `plan` with `input`, due at `now`.
 *
 * @example
 * await driver.push(buildJob(readJob(ChargeCardAction), { cardId }, { scope }, clock.now()));
 */
export function buildJob(
  plan: Pick<
    JobPlan,
    "key" | "queue" | "unique" | "timeout" | "priority" | "scopeConcurrency" | "throttle"
  >,
  input: unknown,
  options: PushOptions,
  now: Date,
  placement: JobPlacement = {},
): QueuedJob {
  const { origin, scope, idempotencyKey, causedBy } = options;
  const priority = options.priority ?? plan.priority;
  const { batchId, chain } = placement;
  return {
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
    runAt: now,
    lease: Duration.seconds(
      (Duration.toMilliseconds(plan.timeout) + Duration.toMilliseconds(JOB_DEFAULTS.leaseGrace)) /
        1000,
    ),
    ...(priority === 0 ? {} : { priority }),
    ...(plan.scopeConcurrency === undefined ? {} : { scopeConcurrency: plan.scopeConcurrency }),
    ...(plan.throttle === undefined ? {} : { throttle: plan.throttle }),
    ...(batchId === undefined ? {} : { batchId }),
    ...(chain === undefined || chain.length === 0 ? {} : { chain }),
  };
}
