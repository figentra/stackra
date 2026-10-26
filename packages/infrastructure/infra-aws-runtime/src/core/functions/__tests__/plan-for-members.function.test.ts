/**
 * Stackra file contract:
 * Purpose: unit tests of `planForMembers`: keeps the named members' queues, caches and buckets and the shared cache,
 *          drops the others', and refuses an empty member list.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0402.
 */
import { describe, expect, it } from "@stackra/testing";

import { planForMembers } from "#core/functions/plan-for-members.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";

const tags = { env: "staging", service: "x" };

const PLAN: RuntimePlan = {
  project: "acme",
  environment: "staging",
  queues: [
    { key: "commerce.default", name: "q1", topic: false, tags },
    { key: "notifications.mail", name: "q2", topic: false, tags },
  ],
  caches: [
    { key: "shared", name: "c0", nodeType: "cache.t4g.small", replicas: 0, tags },
    { key: "notifications.cache", name: "c1", nodeType: "cache.t4g.micro", replicas: 0, tags },
  ],
  buckets: [{ key: "commerce.images", name: "b1", versioning: true, tags }],
};

describe("planForMembers", () => {
  it("keeps the member's resources and the shared cache", () => {
    const plan = planForMembers(PLAN, ["commerce"]);
    expect(plan.queues.map((queue) => queue.key)).toEqual(["commerce.default"]);
    expect(plan.caches.map((cache) => cache.key)).toEqual(["shared"]);
    expect(plan.buckets.map((bucket) => bucket.key)).toEqual(["commerce.images"]);
    expect(plan.project).toBe("acme");
  });

  it("refuses an empty member list", () => {
    expect(() => planForMembers(PLAN, [])).toThrow(TypeError);
  });
});
