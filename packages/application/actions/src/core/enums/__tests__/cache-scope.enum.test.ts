/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CacheScope`: an `Enum.of` enum with the principal, scope and site codes, with a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum); ADR 0305 (rule 31 as amended).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CacheScope } from "#core/enums/cache-scope.enum";

describe("CacheScope", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(CacheScope)).toEqual(["principal", "scope", "site"]);
    expect(CacheScope.Principal).toBe("principal");
    expect(CacheScope.Scope).toBe("scope");
    expect(CacheScope.Site).toBe("site");
  });

  it("types its values", () => {
    expectTypeOf<CacheScope>().toEqualTypeOf<"principal" | "scope" | "site">();
  });
});
