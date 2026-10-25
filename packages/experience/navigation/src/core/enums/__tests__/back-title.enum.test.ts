/**
 * Stackra file contract:
 * Purpose: unit and type tests of `BackTitle`: its codes in order and its value type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { BackTitle } from "#core/enums/back-title.enum";

describe("BackTitle", () => {
  it("lists the back-button labels", () => {
    expect(Enum.values(BackTitle)).toEqual(["default", "generic", "minimal"]);
    expect(BackTitle.Minimal).toBe("minimal");
    expectTypeOf<BackTitle>().toEqualTypeOf<"default" | "generic" | "minimal">();
  });
});
