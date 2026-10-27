/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the template's tests import `fakeFlags` from it, nothing
 *          else is a value, and the `FlagsFake` type it returns resolves.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { FlagReader } from "#core/index";
import * as testing from "#testing/index";
import type { FlagsFake } from "#testing/index";

describe("@stackra/feature-flags/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual(["fakeFlags"]);
  });

  it("resolves its public type", () => {
    expectTypeOf(testing.fakeFlags).returns.toEqualTypeOf<FlagsFake>();
    expectTypeOf<FlagsFake>().toExtend<FlagReader>();
  });
});
