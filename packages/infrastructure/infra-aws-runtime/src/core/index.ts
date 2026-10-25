/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/infra-aws-runtime until `stackra gen` writes the entry barrels
 *          (STA-339): `runtimePlan`, which derives one environment's queues, caches and buckets from the runways, and
 *          the plan types.
 * Boundary: names each re-export and declares nothing. Pure and Pulumi-free; the Pulumi program and the runway file
 *           reader are `./node`'s. The name and node-size helpers stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 (infrastructure).
 */
export { runtimePlan } from "#core/functions/runtime-plan.function";
export type { BucketPlan } from "#core/types/bucket-plan.type";
export type { CachePlan } from "#core/types/cache-plan.type";
export type { QueuePlan } from "#core/types/queue-plan.type";
export type { RuntimePlan } from "#core/types/runtime-plan.type";
