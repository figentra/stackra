/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ResourcePage`: an `Enum.of` enum whose codes are in source order, with a same-named
 *          type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ResourcePage } from "#core/enums/resource-page.enum";

describe("ResourcePage", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(ResourcePage)).toEqual(["list", "create", "edit", "view"]);
    expect(ResourcePage.List).toBe("list");
  });

  it("types its values", () => {
    expectTypeOf<ResourcePage>().toEqualTypeOf<"list" | "create" | "edit" | "view">();
  });
});
