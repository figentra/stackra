/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `mobileStack` is its only value, not also exported by `.`,
 *          and it takes and returns a `MobileInfraPlan`.
 * Boundary: test only; imports the stand-in barrels through their aliases.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { MobileInfraPlan } from "#core/index";
import * as node from "#node/index";

describe("@stackra/infra-mobile/node", () => {
  it("exports exactly its values, none of them also exported by .", () => {
    expect(Object.keys(node).sort()).toEqual(["mobileStack"]);
    for (const name of Object.keys(node)) expect(Object.keys(core)).not.toContain(name);
  });

  it("types the Pulumi slice", () => {
    expectTypeOf(node.mobileStack).parameters.toEqualTypeOf<[plan: MobileInfraPlan]>();
    expectTypeOf(node.mobileStack).returns.toEqualTypeOf<MobileInfraPlan>();
  });
});
