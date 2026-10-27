/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CallOriginKind`: the four snake_case surfaces a call arrives through.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0456 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CallOriginKind } from "#contracts/enums/call-origin-kind.enum";

describe("CallOriginKind", () => {
  it("holds the origin kinds", () => {
    expect(Enum.values(CallOriginKind)).toEqual(["storefront", "console", "api_key", "agent"]);
    expectTypeOf(CallOriginKind.ApiKey).toEqualTypeOf<"api_key">();
  });
});
