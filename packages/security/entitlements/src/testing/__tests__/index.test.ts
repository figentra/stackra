/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the template's tests import `fakeEntitlements` from it,
 *          nothing else is a value, and it returns the `EntitlementSource` the testing module overrides.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { EntitlementSource } from "#core/index";
import * as testing from "#testing/index";

describe("@stackra/entitlements/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual(["fakeEntitlements"]);
  });

  it("returns an EntitlementSource", () => {
    expectTypeOf(testing.fakeEntitlements).returns.toEqualTypeOf<EntitlementSource>();
  });
});
