/**
 * Stackra file contract:
 * Purpose: unit tests of `AuthFlow`: `bff` and `pkce`, in that order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16); ADR 0206 (decision 8).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AuthFlow } from "#core/enums/auth-flow.enum";

describe("AuthFlow", () => {
  it("lists the flows in order", () => {
    expect(Enum.values(AuthFlow)).toEqual(["bff", "pkce"]);
    expectTypeOf<AuthFlow>().toEqualTypeOf<"bff" | "pkce">();
  });
});
