/**
 * Stackra file contract:
 * Purpose: unit tests of `runtimePlan` over runways shaped like the template's: staging gets topic-fed queues with
 *          dead-letter queues, the shared cache, commerce's dedicated cache and versioned buckets, all tagged with the
 *          topology group; dev (memory drivers, no shared pools, a monolith) gets bare queues and no cache; production
 *          tags each member with its own group; an oversized or unknown cache setting fails naming its runway path.
 * Boundary: test only; the runways go through `parseRunway`, so the plan reads exactly what the schemas let through.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decisions 1, 2 and 5); ADR 0186 (decision 3).
 */
import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import type { ServiceRunway } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { runtimePlan } from "#core/functions/runtime-plan.function";

const ROOT = parseRunway("root", {
  version: 3,
  project: "acme-platform",
  environments: {
    dev: {
      topology: { mode: "monolith" },
      defaults: { service: { config: { cache: { driver: "memory" } } } },
    },
    staging: {
      shared: {
        cache: { engine: "valkey", node: "cache.t4g.small", replicas: 0 },
        queues: { provider: "sns-sqs", dlq: true },
        buckets: { versioning: true, lifecycle: { expireNoncurrentDays: 30 } },
      },
      topology: {
        mode: "grouped",
        default: "core",
        groups: { core: { members: ["commerce", "notifications"] } },
      },
      defaults: { service: { config: { cache: { driver: "valkey" } } } },
    },
    production: {
      shared: {
        cache: { engine: "valkey", node: "cache.r7g.large", replicas: 1 },
        queues: { provider: "sns-sqs", dlq: true },
        buckets: { versioning: false, lifecycle: { expireNoncurrentDays: 30 } },
      },
      topology: {
        mode: "grouped",
        groups: {
          commerce: { members: ["commerce"] },
          notifications: { members: ["notifications"] },
        },
      },
      defaults: { service: { config: { cache: { driver: "valkey" } } } },
    },
  },
});

const COMMERCE = parseRunway("service", {
  version: 3,
  requires: {
    cache: {
      dedicated: true,
      engine: "valkey",
      reason: "query-cache entries and rate-limit counters need volatile-ttl eviction of their own",
    },
  },
  environments: {
    dev: { queues: { default: { visibilityTimeoutSeconds: 30 } } },
    staging: {
      cache: { memoryMb: 256, eviction: "volatile-ttl" },
      buckets: { product_images: { storageGb: 5 } },
      queues: { default: { visibilityTimeoutSeconds: 300, dlq: true } },
    },
    production: {
      cache: { memoryMb: 1024, replicas: 1, eviction: "volatile-ttl" },
      buckets: { product_images: { storageGb: 50 } },
      queues: { default: { visibilityTimeoutSeconds: 300 } },
    },
  },
});

const NOTIFICATIONS = parseRunway("service", {
  version: 3,
  environments: {
    staging: { queues: { delivery: { visibilityTimeoutSeconds: 120, dlq: false } } },
    production: { queues: { delivery: { visibilityTimeoutSeconds: 120 } } },
  },
});

/** A commerce runway whose staging cache block is `cache`. */
function commerceWith(cache: Record<string, unknown>): ServiceRunway {
  return parseRunway("service", {
    version: 3,
    requires: { cache: { dedicated: true, engine: "valkey", reason: "own eviction" } },
    environments: { staging: { cache } },
  });
}

describe("runtimePlan", () => {
  it("plans staging from the root's shared pools and each member's sizes", () => {
    const plan = runtimePlan(ROOT, { notifications: NOTIFICATIONS, commerce: COMMERCE }, "staging");
    const commerceTags = { env: "staging", service: "commerce", group: "core" };

    expect(plan).toEqual({
      project: "acme-platform",
      environment: "staging",
      queues: [
        {
          key: "commerce.default",
          name: "acme-platform-staging-commerce-default",
          deadLetterName: "acme-platform-staging-commerce-default-dlq",
          visibilityTimeoutSeconds: 300,
          topic: true,
          tags: commerceTags,
        },
        {
          key: "notifications.delivery",
          name: "acme-platform-staging-notifications-delivery",
          visibilityTimeoutSeconds: 120,
          topic: true,
          tags: { env: "staging", service: "notifications", group: "core" },
        },
      ],
      caches: [
        {
          key: "shared",
          name: "acme-platform-staging-cache",
          nodeType: "cache.t4g.small",
          replicas: 0,
          tags: { env: "staging", service: "shared" },
        },
        {
          key: "commerce.cache",
          name: "acme-platform-staging-commerce-cache",
          nodeType: "cache.t4g.micro",
          replicas: 0,
          eviction: "volatile-ttl",
          tags: commerceTags,
        },
      ],
      buckets: [
        {
          key: "commerce.product_images",
          name: "acme-platform-staging-commerce-product-images",
          versioning: true,
          expireNoncurrentDays: 30,
          tags: commerceTags,
        },
      ],
      databases: [],
      workloads: [],
      cost: {
        items: [
          { key: "shared", monthlyUsd: 24 },
          { key: "commerce.cache", monthlyUsd: 12 },
        ],
        monthlyUsd: 36,
        limit: 500,
      },
    });
    expect(plan.queues[1]?.deadLetterName).toBeUndefined();
  });

  it("plans no cache and no topic in dev, where the drivers are in memory and nothing is shared", () => {
    const plan = runtimePlan(ROOT, { commerce: COMMERCE, notifications: NOTIFICATIONS }, "dev");

    expect(plan.caches).toEqual([]);
    expect(plan.buckets).toEqual([]);
    expect(plan.queues).toEqual([
      {
        key: "commerce.default",
        name: "acme-platform-dev-commerce-default",
        visibilityTimeoutSeconds: 30,
        topic: false,
        tags: { env: "dev", service: "commerce" },
      },
    ]);
    expect(plan.queues[0]?.deadLetterName).toBeUndefined();
  });

  it("tags each member with its own group and keeps versioning off when the root turns it off", () => {
    const plan = runtimePlan(
      ROOT,
      { commerce: COMMERCE, notifications: NOTIFICATIONS },
      "production",
    );

    expect(
      plan.queues.map((queue) => [queue.key, queue.tags["group"], queue.deadLetterName]),
    ).toEqual([
      ["commerce.default", "commerce", "acme-platform-production-commerce-default-dlq"],
      [
        "notifications.delivery",
        "notifications",
        "acme-platform-production-notifications-delivery-dlq",
      ],
    ]);
    expect(plan.caches.map((cache) => [cache.key, cache.nodeType, cache.replicas])).toEqual([
      ["shared", "cache.r7g.large", 1],
      ["commerce.cache", "cache.t4g.small", 1],
    ]);
    expect(plan.buckets[0]).toMatchObject({ versioning: false });
    expect(plan.buckets[0]?.expireNoncurrentDays).toBeUndefined();
  });

  it("plans nothing for an environment no runway declares", () => {
    expect(runtimePlan(ROOT, { commerce: COMMERCE }, "preview")).toEqual({
      project: "acme-platform",
      environment: "preview",
      queues: [],
      caches: [],
      buckets: [],
      databases: [],
      workloads: [],
      cost: { items: [], monthlyUsd: 0 },
    });
  });

  it("fails naming the path when a dedicated cache cannot be sized or evicts by an unknown policy", () => {
    expect(() =>
      runtimePlan(ROOT, { commerce: commerceWith({ memoryMb: 200_000 }) }, "staging"),
    ).toThrow(RunwayInvalidError);
    expect(() =>
      runtimePlan(ROOT, { commerce: commerceWith({ memoryMb: 200_000 }) }, "staging"),
    ).toThrow(/environments\.staging\.cache\.memoryMb/);
    expect(() =>
      runtimePlan(ROOT, { commerce: commerceWith({ eviction: "random" }) }, "staging"),
    ).toThrow(/environments\.staging\.cache\.eviction/);
  });
});
