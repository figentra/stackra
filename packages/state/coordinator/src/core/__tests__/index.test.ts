/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the registry row's election and lock are exported with the method
 *          enum and their types, and nothing internal is (the three methods, their detection, the module state).
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as coordinator from "#core/index";
import type { ElectLeaderOptions, LeaderElection } from "#core/index";

describe("@stackra/coordinator", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(coordinator).sort()).toEqual([
      "ElectionMethod",
      "electLeader",
      "withTabLock",
    ]);
  });

  it("types electLeader with its options and election", () => {
    expectTypeOf(coordinator.electLeader).parameters.toEqualTypeOf<
      [name: string, options?: ElectLeaderOptions | undefined]
    >();
    expectTypeOf(coordinator.electLeader).returns.toEqualTypeOf<LeaderElection>();
  });
});
