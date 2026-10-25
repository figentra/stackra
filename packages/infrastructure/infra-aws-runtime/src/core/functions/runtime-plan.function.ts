/**
 * Stackra file contract:
 * Purpose: `runtimePlan(root, services, environment)`, the AWS runtime resources of one environment derived from the
 *          parsed root runway and the service member runways: each queue a member sizes (a dead-letter queue when the
 *          member or the root's `shared.queues.dlq` asks, an SNS topic in front when `shared.queues.provider` is
 *          `sns-sqs`), the shared Valkey cache (`shared.cache.engine: valkey`), each dedicated Valkey cache a member
 *          `requires` where its cache driver is `valkey`, and each bucket a member sizes (versioning and the expiry
 *          of noncurrent versions from `shared.buckets`). Every resource is tagged with the environment, the member
 *          and the topology group that runs it.
 * Boundary: pure; parsed runways in, plain data out. Reading the files is `readRuntimePlan`'s and declaring the
 *           resources `awsRuntime`'s (`./node`). `requires` matters here for `valkey` only: a member's queues and
 *           buckets are its own already, and a dedicated `postgres` server is the database stack's, not this one's.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1, 2, 4 and 5), ADR 0169 (topology), ADR 0186 (decision 3: versioned
 *                     object storage), ADR 0172 (decision 5: cost tags), ADR 0171 (decisions 2 and 3).
 */
import { Enum } from "@stackra/contracts";
import { CacheEviction, RequirementEngine, RunwayInvalidError } from "@stackra/runway";
import type { RootRunway, RunwayEnvironment, ServiceRunway } from "@stackra/runway";

import { CACHE_NODE_TYPES } from "#core/constants/cache-node-types.constant";
import { cacheNodeType } from "#core/functions/cache-node-type.function";
import { resourceName } from "#core/functions/resource-name.function";
import type { BucketPlan } from "#core/types/bucket-plan.type";
import type { CachePlan } from "#core/types/cache-plan.type";
import type { QueuePlan } from "#core/types/queue-plan.type";
import type { RuntimePlan } from "#core/types/runtime-plan.type";

/** The longest SQS queue name (SNS topics, named like their queue, allow more). */
const QUEUE_NAME_LIMIT = 80;

/** The longest S3 bucket name. */
const BUCKET_NAME_LIMIT = 63;

/** The longest ElastiCache replication group id. */
const CACHE_ID_LIMIT = 40;

/** `block[key]` when `block` is an object: the shared pools and config values are open runway blocks. */
function fieldOf(block: unknown, key: string): unknown {
  return typeof block === "object" && block !== null
    ? (block as Record<string, unknown>)[key]
    : undefined;
}

/**
 * The runtime resources of `environment`.
 *
 * @param root - the parsed root runway.
 * @param services - each service member's parsed runway, by member key.
 * @param environment - the environment to plan.
 * @throws RunwayInvalidError when a dedicated cache asks for more memory than the largest node holds, or names an
 *         eviction policy Valkey does not have.
 * @example
 * const plan = runtimePlan(root, { commerce, notifications }, "staging");
 * plan.queues[0]?.name; // "acme-platform-staging-commerce-default"
 */
export function runtimePlan(
  root: RootRunway,
  services: Readonly<Record<string, ServiceRunway>>,
  environment: RunwayEnvironment,
): RuntimePlan {
  const rootEnvironment = root.environments[environment];
  const shared = rootEnvironment?.shared;
  const topology = rootEnvironment?.topology;
  const isTopicFed = fieldOf(shared?.queues, "provider") === RequirementEngine.SnsSqs;
  const isDeadLetterDefault = fieldOf(shared?.queues, "dlq") === true;
  const isVersioned = fieldOf(shared?.buckets, "versioning") !== false;
  const expiry = fieldOf(fieldOf(shared?.buckets, "lifecycle"), "expireNoncurrentDays");
  const defaultCacheDriver = fieldOf(
    rootEnvironment?.defaults?.service?.config?.["cache"],
    "driver",
  );

  const tagsOf = (member: string): Record<string, string> => {
    const group =
      Object.entries(topology?.groups ?? {}).find(([, { members }]) =>
        members.includes(member),
      )?.[0] ?? topology?.default;
    return group === undefined
      ? { env: environment, service: member }
      : { env: environment, service: member, group };
  };

  const queues: QueuePlan[] = [];
  const caches: CachePlan[] = [];
  const buckets: BucketPlan[] = [];

  if (fieldOf(shared?.cache, "engine") === RequirementEngine.Valkey) {
    const node = fieldOf(shared?.cache, "node");
    const replicas = fieldOf(shared?.cache, "replicas");
    caches.push({
      key: "shared",
      name: resourceName([root.project, environment, "cache"], CACHE_ID_LIMIT),
      nodeType: typeof node === "string" ? node : CACHE_NODE_TYPES[0].type,
      replicas: typeof replicas === "number" ? replicas : 0,
      tags: { env: environment, service: "shared" },
    });
  }

  for (const [member, runway] of Object.entries(services).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const values = runway.environments[environment];
    const tags = tagsOf(member);

    for (const [key, queue] of Object.entries(values?.queues ?? {})) {
      queues.push({
        key: `${member}.${key}`,
        name: resourceName([root.project, environment, member, key], QUEUE_NAME_LIMIT),
        deadLetterName:
          (queue.dlq ?? isDeadLetterDefault)
            ? resourceName([root.project, environment, member, key, "dlq"], QUEUE_NAME_LIMIT)
            : undefined,
        visibilityTimeoutSeconds: queue.visibilityTimeoutSeconds,
        topic: isTopicFed,
        tags,
      });
    }

    // The Valkey cache driver's name is its engine's; a dedicated cache exists only where that driver runs.
    const cacheDriver = fieldOf(values?.config?.["cache"], "driver") ?? defaultCacheDriver;
    for (const [requirement, { engine, dedicated }] of Object.entries(runway.requires ?? {})) {
      if (
        engine !== RequirementEngine.Valkey ||
        dedicated !== true ||
        cacheDriver !== RequirementEngine.Valkey
      )
        continue;
      const size = values?.cache;
      const nodeType = cacheNodeType(size?.memoryMb);
      const eviction = size?.eviction;
      if (nodeType === undefined)
        throw new RunwayInvalidError(`${member} service runway`, [
          {
            path: `environments.${environment}.cache.memoryMb`,
            message: `No ElastiCache node holds ${size?.memoryMb} MB; the largest, ${CACHE_NODE_TYPES.at(-1)?.type}, holds three quarters of ${CACHE_NODE_TYPES.at(-1)?.memoryMb} MB`,
          },
        ]);
      if (eviction !== undefined && !(Enum.values(CacheEviction) as string[]).includes(eviction))
        throw new RunwayInvalidError(`${member} service runway`, [
          {
            path: `environments.${environment}.cache.eviction`,
            message: `Expected a Valkey eviction policy: ${Enum.values(CacheEviction).join(", ")}`,
          },
        ]);
      caches.push({
        key: `${member}.${requirement}`,
        name: resourceName([root.project, environment, member, requirement], CACHE_ID_LIMIT),
        nodeType,
        replicas: size?.replicas ?? 0,
        eviction: eviction as CacheEviction | undefined,
        tags,
      });
    }

    for (const key of Object.keys(values?.buckets ?? {})) {
      buckets.push({
        key: `${member}.${key}`,
        name: resourceName([root.project, environment, member, key], BUCKET_NAME_LIMIT),
        versioning: isVersioned,
        expireNoncurrentDays: isVersioned && typeof expiry === "number" ? expiry : undefined,
        tags,
      });
    }
  }

  return { project: root.project, environment, queues, caches, buckets };
}
