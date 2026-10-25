/**
 * Stackra file contract:
 * Purpose: unit tests of `IdentityAppKind`: the BFF and the native client, as snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0206 (decision 8); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { IdentityAppKind } from "#core/enums/identity-app-kind.enum";

describe("IdentityAppKind", () => {
  it("lists the two kinds", () => {
    expect(Enum.values(IdentityAppKind)).toEqual(["bff", "native"]);
    expectTypeOf<IdentityAppKind>().toEqualTypeOf<"bff" | "native">();
  });
});
