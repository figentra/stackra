/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `runtimePlan` is its only value (the name and node-size helpers
 *          stay internal), and the plan types resolve with the shapes `awsRuntime` reads.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { RootRunway, RunwayEnvironment, ServiceRunway } from "@stackra/runway";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as runtime from "#core/index";
import type { BucketPlan, CachePlan, QueuePlan, RuntimePlan } from "#core/index";

describe("@stackra/infra-aws-runtime", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(runtime).sort()).toEqual(["runtimePlan"]);
  });

  it("types the plan", () => {
    expectTypeOf(runtime.runtimePlan).parameters.toEqualTypeOf<
      [
        root: RootRunway,
        services: Readonly<Record<string, ServiceRunway>>,
        environment: RunwayEnvironment,
      ]
    >();
    expectTypeOf(runtime.runtimePlan).returns.toEqualTypeOf<RuntimePlan>();
    expectTypeOf<RuntimePlan["queues"]>().toEqualTypeOf<readonly QueuePlan[]>();
    expectTypeOf<RuntimePlan["caches"]>().toEqualTypeOf<readonly CachePlan[]>();
    expectTypeOf<RuntimePlan["buckets"]>().toEqualTypeOf<readonly BucketPlan[]>();
  });
});
