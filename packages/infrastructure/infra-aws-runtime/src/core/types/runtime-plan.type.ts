/**
 * Stackra file contract:
 * Purpose: `RuntimePlan`, what `runtimePlan` derives from the root and service runways for one environment: the
 *          queues, caches and buckets the AWS runtime program declares, in member order.
 * Boundary: type only; plain data a test can compare and `awsRuntime` (`./node`) turns into Pulumi resources.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1 and 2), ADR 0171 (decisions 2 and 3: Pulumi programs from runway).
 */
import type { RunwayEnvironment } from "@stackra/runway";

import type { BucketPlan } from "#core/types/bucket-plan.type";
import type { CachePlan } from "#core/types/cache-plan.type";
import type { QueuePlan } from "#core/types/queue-plan.type";

/** One environment's runtime resources. */
export type RuntimePlan = {
  /** The root runway's `project`, the first part of every name. */
  readonly project: string;
  /** The environment the plan is for. */
  readonly environment: RunwayEnvironment;
  /** Every member queue, member by member. */
  readonly queues: readonly QueuePlan[];
  /** The shared cache first, then each dedicated cache. */
  readonly caches: readonly CachePlan[];
  /** Every member bucket, member by member. */
  readonly buckets: readonly BucketPlan[];
};
