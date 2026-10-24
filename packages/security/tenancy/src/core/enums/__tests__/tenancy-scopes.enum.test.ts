/**
 * Stackra file contract:
 * Purpose: unit and type tests of `TenancyScopes`: one snake_case code, `tenant`, typed as that literal.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0323 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { TenancyScopes } from "#core/enums/tenancy-scopes.enum";

describe("TenancyScopes", () => {
  it("holds the tenant level's code only", () => {
    expect(Enum.values(TenancyScopes)).toEqual(["tenant"]);
    expect(TenancyScopes.Tenant).toBe("tenant");
    expectTypeOf<TenancyScopes>().toEqualTypeOf<"tenant">();
  });
});
