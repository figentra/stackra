/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: exactly its values, the plan and seed functions typed as
 *          `stackra infra gen` and `stackra dev` call them, and the plan and seed types.
 * Boundary: test only; imports the stand-in barrel through its alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { RootRunway } from "@stackra/runway";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { IdentityPlan, IdentityPlanApp, IdentitySeed } from "#core/index";

describe("@stackra/infra-identity", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "IdentityAppKind",
      "IdentityHealthIndicatorDriver",
      "IdentityInfraInvalidError",
      "InfraIdentityConfig",
      "InfraIdentityConfig$",
      "InstanceRole",
      "identityPlan",
      "parseIdentitySeed",
    ]);
  });

  it("types the seed check and the plan", () => {
    expectTypeOf(core.parseIdentitySeed).parameters.toEqualTypeOf<
      [document: unknown, source?: string | undefined]
    >();
    expectTypeOf(core.parseIdentitySeed).returns.toEqualTypeOf<IdentitySeed>();
    expectTypeOf(core.identityPlan).parameters.toEqualTypeOf<
      [root: RootRunway, seed: IdentitySeed, instance: string]
    >();
    expectTypeOf(core.identityPlan).returns.toEqualTypeOf<IdentityPlan>();
    expectTypeOf<IdentityPlan["apps"]>().toEqualTypeOf<readonly IdentityPlanApp[]>();
  });
});
