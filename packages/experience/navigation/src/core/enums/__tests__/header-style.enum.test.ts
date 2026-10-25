/**
 * Stackra file contract:
 * Purpose: unit and type tests of `HeaderStyle`: its codes in order and its value type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { HeaderStyle } from "#core/enums/header-style.enum";

describe("HeaderStyle", () => {
  it("lists the header styles", () => {
    expect(Enum.values(HeaderStyle)).toEqual(["default", "large", "hidden"]);
    expect(HeaderStyle.Large).toBe("large");
    expectTypeOf<HeaderStyle>().toEqualTypeOf<"default" | "large" | "hidden">();
  });
});
