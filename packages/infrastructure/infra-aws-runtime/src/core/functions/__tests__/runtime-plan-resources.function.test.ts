/**
 * Stackra file contract:
 * Purpose: unit tests of `runtimePlan` over the runway's `resources` and `workloads` (ADR 0493): a Postgres resource
 *          plans the size's class per environment (small, the smallest Graviton single-AZ, where unsized) with its
 *          consumers; queue, topic, cache and bucket resources plan like member ones; a workload plans its task size,
 *          count and exposure; a member using an unknown resource is refused; the monthly estimate is itemised, a dev
 *          plan over its default $150 cap is refused naming the items, and production with no cap only carries the
 *          estimate.
 * Boundary: test only; parsed runway objects in, plain data out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0493 (decisions 1 to 3); spec sta-1640.
 */
import { describe, expect, it } from "@stackra/testing";
import { parseRunway, RunwayInvalidError } from "@stackra/runway";

import { runtimePlan } from "#core/functions/runtime-plan.function";

const DIGEST = `ghcr.io/zitadel/zitadel@sha256:${"b".repeat(64)}`;

/** A root runway with resources and a workload, and `extra` merged into its top. */
function rootWith(extra: Record<string, unknown> = {}) {
  return parseRunway("root", {
    version: 3,
    project: "academorix",
    environments: { dev: {}, staging: {}, production: {} },
    resources: {
      "main-db": { kind: "postgres", size: { production: "large" } },
      jobs: { kind: "queue" },
      events: { kind: "topic" },
      sessions: { kind: "cache", size: { staging: "medium" } },
      uploads: { kind: "bucket" },
    },
    workloads: {
      zitadel: {
        image: DIGEST,
        port: 8080,
        health: "/debug/healthz",
        expose: "public",
        uses: ["main-db"],
        secrets: ["ZITADEL_MASTERKEY"],
        scale: { production: { min: 2, max: 4 } },
        reason: "Residency: KSA in-country",
      },
    },
    ...extra,
  });
}

const IDENTITY = parseRunway("service", { version: 3, uses: ["main-db"], environments: {} });

describe("runtimePlan resources and workloads", () => {
  // @covers sta-1640:FR-005
  // @covers sta-1640:FR-007
  it("plans a Postgres resource per environment with its consumers, small where unsized", () => {
    const dev = runtimePlan(rootWith(), { identity: IDENTITY }, "dev");
    const production = runtimePlan(rootWith(), { identity: IDENTITY }, "production");

    expect(dev.databases).toEqual([
      {
        key: "resources.main-db",
        resource: "main-db",
        name: "academorix-dev-main-db",
        engine: "rds",
        version: "17",
        instanceClass: "db.t4g.micro",
        multiAz: false,
        storageGb: 20,
        backupDays: 14,
        consumers: ["identity", "zitadel"],
        tags: { env: "dev", service: "main-db" },
      },
    ]);
    expect(production.databases[0]).toMatchObject({ instanceClass: "db.r7g.large", multiAz: true });
  });

  // @covers sta-1640:FR-001
  it("plans queue, topic, cache and bucket resources like member ones", () => {
    const plan = runtimePlan(rootWith(), {}, "staging");

    expect(plan.queues.map((queue) => [queue.key, queue.topic])).toEqual([
      ["resources.events", true],
      ["resources.jobs", false],
    ]);
    expect(plan.caches).toEqual([
      {
        key: "resources.sessions",
        name: "academorix-staging-sessions",
        nodeType: "cache.t4g.medium",
        replicas: 0,
        tags: { env: "staging", service: "sessions" },
      },
    ]);
    expect(plan.buckets.map((bucket) => bucket.key)).toEqual(["resources.uploads"]);
  });

  // @covers sta-1640:FR-009
  it("plans a workload's task size, count and exposure", () => {
    const [dev] = runtimePlan(rootWith(), {}, "dev").workloads;
    const [production] = runtimePlan(rootWith(), {}, "production").workloads;

    expect(dev).toMatchObject({
      key: "workloads.zitadel",
      name: "academorix-dev-zitadel",
      image: DIGEST,
      public: true,
      cpu: 256,
      memoryMb: 512,
      scale: { min: 1, max: 1 },
      uses: ["main-db"],
      secrets: ["ZITADEL_MASTERKEY"],
    });
    expect(production?.scale).toEqual({ min: 2, max: 4 });
  });

  // @covers sta-1640:FR-003
  it("refuses a member that uses a resource the runway does not declare", () => {
    const stray = parseRunway("service", { version: 3, uses: ["ledger-db"], environments: {} });

    expect(() => runtimePlan(rootWith(), { identity: stray }, "dev")).toThrow(RunwayInvalidError);
  });

  // @covers sta-1640:FR-006
  it("itemises the estimate, refuses a dev plan over its $150 cap, and only carries production's", () => {
    const dev = runtimePlan(rootWith(), {}, "dev");
    expect(dev.cost).toEqual({
      items: [
        { key: "resources.sessions", monthlyUsd: 12 },
        { key: "resources.main-db", monthlyUsd: 45 },
        { key: "workloads.zitadel", monthlyUsd: 30 },
      ],
      monthlyUsd: 87,
      limit: 150,
    });

    const costly = rootWith({
      resources: { "main-db": { kind: "postgres", size: { dev: "large" } } },
    });
    expect(() => runtimePlan(costly, {}, "dev")).toThrow(/environments\.dev\.limits\.monthly/);
    expect(() => runtimePlan(costly, {}, "dev")).toThrow(/resources\.main-db \$450/);

    const production = runtimePlan(rootWith(), {}, "production");
    expect(production.cost.limit).toBeUndefined();
    expect(production.cost.monthlyUsd).toBe(12 + 450 + (10 * 2 + 20));
  });

  // @covers sta-1640:FR-006
  it("takes the runway's own cap over the default", () => {
    const capped = rootWith({ environments: { dev: { limits: { monthly: 50 } } } });

    expect(() => runtimePlan(capped, {}, "dev")).toThrow(/over its \$50 cap/);
  });
});
