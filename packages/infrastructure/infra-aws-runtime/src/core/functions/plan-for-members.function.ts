/**
 * Stackra file contract:
 * Purpose: `planForMembers(plan, members)`, a runtime plan narrowed to the members one stack deploys: their queues,
 *          caches and buckets, plus the environment's shared cache they connect to; the runway's own resources and
 *          workloads stay with the environment's whole stack.
 * Boundary: pure; plan in, plan out. A stack per service (or per topology group) composes it so one service can deploy
 *           through the runtime stack before the others move.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2: topology groups), ADR 0171 (decision 3), ADR 0402, ADR 0493.
 */
import type { RuntimePlan } from "#core/types/runtime-plan.type";

/**
 * The part of `plan` that belongs to `members`.
 *
 * @throws TypeError when no member is named.
 * @example
 * planForMembers(plan, ["commerce"]).queues.map((queue) => queue.key); // ["commerce.default"]
 */
export function planForMembers(plan: RuntimePlan, members: readonly string[]): RuntimePlan {
  if (members.length === 0)
    throw new TypeError("Name at least one member the runtime stack deploys");
  const owned = (key: string) => members.includes(key.split(".")[0] ?? "");
  return {
    ...plan,
    queues: plan.queues.filter((queue) => owned(queue.key)),
    caches: plan.caches.filter((cache) => cache.key === "shared" || owned(cache.key)),
    buckets: plan.buckets.filter((bucket) => owned(bucket.key)),
    // The runway's resources and workloads are shared: only the environment's whole stack declares them (ADR 0493).
    databases: [],
    workloads: [],
  };
}
