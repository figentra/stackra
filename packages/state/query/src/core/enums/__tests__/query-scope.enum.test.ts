/**
 * Stackra file contract:
 * Purpose: unit and type tests of `QueryScope`: two snake_case codes, the active scope and the principal, and no level
 *          name of any scope-owning package.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16); R-59.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { QueryScope } from "#core/enums/query-scope.enum";

describe("QueryScope", () => {
  it("lists the active scope and the principal", () => {
    expect(Enum.values(QueryScope)).toEqual(["active_scope", "principal"]);
    expect(QueryScope.ActiveScope).toBe("active_scope");
    expectTypeOf<QueryScope>().toEqualTypeOf<"active_scope" | "principal">();
  });
});
