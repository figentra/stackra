/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the plan builder, its owner-step enum and its error are exported,
 *          nothing else is (`configKeyOf` stays internal), the entry loads without Pulumi, and the public types
 *          resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { AppRunway, RootRunway } from "@stackra/runway";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as mobile from "#core/index";
import type {
  MobileIdentity,
  MobileInfraPlan,
  MobileOwnerStep,
  MobileOwnerTask,
  MobileReleaseEnvironment,
} from "#core/index";

describe("@stackra/infra-mobile", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(mobile).sort()).toEqual([
      "MobileHealthIndicatorDriver",
      "MobileInfraInvalidError",
      "MobileOwnerStep",
      "mobileInfraPlan",
    ]);
  });

  it("types the plan builder", () => {
    expectTypeOf(mobile.mobileInfraPlan).parameters.toEqualTypeOf<
      [root: RootRunway, app: AppRunway, identity: MobileIdentity]
    >();
    expectTypeOf(mobile.mobileInfraPlan).returns.toEqualTypeOf<MobileInfraPlan>();
  });

  it("resolves the public types", () => {
    expectTypeOf<MobileInfraPlan["environments"]>().toEqualTypeOf<
      readonly MobileReleaseEnvironment[]
    >();
    expectTypeOf<MobileInfraPlan["ownerTasks"]>().toEqualTypeOf<readonly MobileOwnerTask[]>();
    expectTypeOf<MobileOwnerTask["step"]>().toEqualTypeOf<MobileOwnerStep>();
  });
});
