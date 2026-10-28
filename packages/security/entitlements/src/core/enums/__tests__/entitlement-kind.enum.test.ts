/**
 * Stackra file contract:
 * Purpose: unit and type tests of `EntitlementKind`: the three kinds of ADR 0215 decision 1 and the value kind of
 *          ADR 0408 and the quota kind of
 *          ADR 0216 (stackra-309), in order, with snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0215 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { EntitlementKind } from "#core/enums/entitlement-kind.enum";

describe("EntitlementKind", () => {
  it("has the three kinds of ADR 0215, the value kind and the quota kind", () => {
    expect(Enum.values(EntitlementKind)).toEqual(["feature", "limit", "module", "value", "quota"]);
    expect(EntitlementKind.Limit).toBe("limit");
  });

  it("types a kind as its codes", () => {
    expectTypeOf<EntitlementKind>().toEqualTypeOf<
      "feature" | "limit" | "module" | "value" | "quota"
    >();
  });
});
