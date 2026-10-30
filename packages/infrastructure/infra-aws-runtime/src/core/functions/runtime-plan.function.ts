/**
 * Stackra file contract:
 * Purpose: `runtimePlan(root, services, environment)`, the AWS runtime resources of one environment derived from the
 *          parsed root runway and the service member runways: each queue a member sizes (a dead-letter queue when the
 *          member or the root's `shared.queues.dlq` asks, an SNS topic in front when `shared.queues.provider` is
 *          `sns-sqs`), the shared Valkey cache (`shared.cache.engine: valkey`), each dedicated Valkey cache a member
 *          `requires` where its cache driver is `valkey`, and each bucket a member sizes (versioning and the expiry
 *          of noncurrent versions from `shared.buckets`). Every resource is tagged with the environment, the member
 *          and the topology group that runs it. Then the runway's own `resources` (Postgres, and queues, topics, caches
 *          and buckets by name) and `workloads`, sized per environment from the catalogues, with the consumers each
 *          resource admits; the monthly estimate is checked against the environment's cap (ADR 0493).
 * Boundary: pure; parsed runways in, plain data out. Reading the files is `readRuntimePlan`'s and declaring the
 *           resources `awsRuntime`'s (`./node`). `requires` matters here for `valkey` only: a member's queues and
 *           buckets are its own already, and a dedicated `postgres` server is the database stack's, not this one's.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1, 2, 4 and 5), ADR 0493 (decisions 1 to 3), ADR 0169 (topology), ADR 0186 (decision 3: versioned
 *                     object storage), ADR 0172 (decision 5: cost tags), ADR 0171 (decisions 2 and 3).
 */
import { Enum } from "@stackra/contracts";
import {
  CacheEviction,
  RequirementEngine,
  ResourceKind,
  ResourceSize,
  RunwayInvalidError,
} from "@stackra/runway";
import type { RootRunway, RunwayEnvironment, ServiceRunway } from "@stackra/runway";

import { CACHE_NODE_TYPES } from "#core/constants/cache-node-types.constant";
import { CACHE_SIZES } from "#core/constants/cache-sizes.constant";
import { DEFAULT_MONTHLY_LIMITS } from "#core/constants/default-monthly-limits.constant";
import { LOAD_BALANCER_MONTHLY_USD } from "#core/constants/load-balancer-monthly-usd.constant";
import { POSTGRES_SIZES } from "#core/constants/postgres-sizes.constant";
import { WORKLOAD_SIZES } from "#core/constants/workload-sizes.constant";
import { cacheNodeType } from "#core/functions/cache-node-type.function";
import { resourceName } from "#core/functions/resource-name.function";
import type { BucketPlan } from "#core/types/bucket-plan.type";
import type { CachePlan } from "#core/types/cache-plan.type";
import type { DatabasePlan } from "#core/types/database-plan.type";
import type { QueuePlan } from "#core/types/queue-plan.type";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import type { WorkloadPlan } from "#core/types/workload-plan.type";

/** The longest SQS queue name (SNS topics, named like their queue, allow more). */
const QUEUE_NAME_LIMIT = 80;

/** The longest S3 bucket name. */
const BUCKET_NAME_LIMIT = 63;

/** The longest ElastiCache replication group id. */
const CACHE_ID_LIMIT = 40;

/** The longest RDS identifier. */
const DATABASE_ID_LIMIT = 63;

/** The longest ECS service name we use (a target group name, its tightest user, allows 32). */
const SERVICE_NAME_LIMIT = 32;

/** The Postgres major version a resource gets when it names none. */
const POSTGRES_VERSION = "17";

/** Days of automated backups, the point-in-time window of ADR 0186 decision 1. */
const BACKUP_DAYS = 14;

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
 *         eviction policy Valkey does not have, when a member uses a resource the runway does not declare, or when the
 *         monthly estimate passes the environment's cap.
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

  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
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

  // ADR 0493: the runway's own resources, after the member-derived ones.
  const sizeOf = (sizes: Partial<Record<string, ResourceSize>> | undefined): ResourceSize =>
    sizes?.[environment] ?? ResourceSize.Small;
  const resources = root.resources ?? {};
  const consumersOf = new Map<string, string[]>();
  const use = (consumer: string, used: readonly string[], source: string, path: string): void => {
    for (const name of used) {
      if (resources[name] === undefined)
        throw new RunwayInvalidError(source, [
          { path, message: `No resource named ${name} in the root runway's resources` },
        ]);
      consumersOf.set(name, [...(consumersOf.get(name) ?? []), consumer]);
    }
  };
  for (const [member, runway] of Object.entries(services))
    use(member, runway.uses ?? [], `${member} service runway`, "uses");
  for (const [name, workload] of Object.entries(root.workloads ?? {}))
    use(name, workload.uses ?? [], "runway.yaml", `workloads.${name}.uses`);

  const databases: DatabasePlan[] = [];
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const [name, resource] of Object.entries(resources).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const key = `resources.${name}`;
    const tags = { env: environment, service: name };
    const size = sizeOf(resource.size);
    if (resource.kind === ResourceKind.Postgres) {
      const sized = POSTGRES_SIZES[size];
      databases.push({
        key,
        resource: name,
        name: resourceName([root.project, environment, name], DATABASE_ID_LIMIT),
        engine: resource.engine ?? "rds",
        version: resource.version ?? POSTGRES_VERSION,
        instanceClass: sized.instanceClass,
        multiAz: sized.multiAz,
        storageGb: sized.storageGb,
        backupDays: BACKUP_DAYS,
        // oxlint-disable-next-line unicorn/no-array-sort -- a copy built here
        consumers: [...(consumersOf.get(name) ?? [])].sort(),
        tags,
      });
    } else if (resource.kind === ResourceKind.Cache)
      caches.push({
        key,
        name: resourceName([root.project, environment, name], CACHE_ID_LIMIT),
        nodeType: CACHE_SIZES[size],
        replicas: 0,
        tags,
      });
    else if (resource.kind === ResourceKind.Bucket)
      buckets.push({
        key,
        name: resourceName([root.project, environment, name], BUCKET_NAME_LIMIT),
        versioning: isVersioned,
        expireNoncurrentDays: isVersioned && typeof expiry === "number" ? expiry : undefined,
        tags,
      });
    else
      queues.push({
        key,
        name: resourceName([root.project, environment, name], QUEUE_NAME_LIMIT),
        deadLetterName: isDeadLetterDefault
          ? resourceName([root.project, environment, name, "dlq"], QUEUE_NAME_LIMIT)
          : undefined,
        topic: resource.kind === ResourceKind.Topic,
        tags,
      });
  }

  const workloads: WorkloadPlan[] = Object.entries(root.workloads ?? {}).map(([name, workload]) => {
    const sized = WORKLOAD_SIZES[sizeOf(workload.size)];
    return {
      key: `workloads.${name}`,
      workload: name,
      name: resourceName([root.project, environment, name], SERVICE_NAME_LIMIT),
      image: workload.image,
      port: workload.port,
      health: workload.health,
      public: workload.expose === "public",
      env: workload.env ?? {},
      secrets: workload.secrets ?? [],
      uses: workload.uses ?? [],
      cpu: sized.cpu,
      memoryMb: sized.memoryMb,
      scale: workload.scale?.[environment] ?? { min: 1, max: 1 },
      tags: { env: environment, service: name },
    };
  });

  const items = [
    ...caches.map((cache) => ({
      key: cache.key,
      monthlyUsd:
        (CACHE_NODE_TYPES.find((node) => node.type === cache.nodeType)?.monthlyUsd ?? 0) *
        (1 + cache.replicas),
    })),
    ...databases.map((database) => ({
      key: database.key,
      monthlyUsd: POSTGRES_SIZES[sizeOf(resources[database.resource]?.size)].monthlyUsd,
    })),
    ...workloads.map((workload) => ({
      key: workload.key,
      monthlyUsd:
        WORKLOAD_SIZES[sizeOf(root.workloads?.[workload.workload]?.size)].monthlyUsd *
          Math.max(workload.scale.min, 1) +
        (workload.public ? LOAD_BALANCER_MONTHLY_USD : 0),
    })),
  ];
  const monthlyUsd = items.reduce((sum, item) => sum + item.monthlyUsd, 0);
  const limit = rootEnvironment?.limits?.monthly ?? DEFAULT_MONTHLY_LIMITS[environment];
  if (limit !== undefined && monthlyUsd > limit)
    throw new RunwayInvalidError("runway.yaml", [
      {
        path: `environments.${environment}.limits.monthly`,
        message: `The ${environment} plan's estimate is $${monthlyUsd} a month, over its $${limit} cap: ${items
          .filter((item) => item.monthlyUsd > 0)
          .map((item) => `${item.key} $${item.monthlyUsd}`)
          .join(", ")}`,
      },
    ]);

  return {
    project: root.project,
    environment,
    queues,
    caches,
    buckets,
    databases,
    workloads,
    cost: { items, monthlyUsd, ...(limit === undefined ? {} : { limit }) },
  };
}
