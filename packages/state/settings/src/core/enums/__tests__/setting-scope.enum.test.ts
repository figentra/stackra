/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SettingScope`: the four levels settings names, in cascade order, and no level
 *          another package contributes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 22); ADR 0323 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingScope } from "#core/enums/setting-scope.enum";

describe("SettingScope", () => {
  it("names the platform, a product, a node and the user, in that order", () => {
    expect(Enum.values(SettingScope)).toEqual(["platform", "product", "node", "user"]);
    expect(SettingScope.User).toBe("user");
  });

  it("types its codes", () => {
    expectTypeOf<SettingScope>().toEqualTypeOf<"platform" | "product" | "node" | "user">();
  });
});
