/**
 * Stackra file contract:
 * Purpose: unit tests of `Misfire`: the three missed-run policies in order, catch-up first.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0148 (decision 5).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Misfire } from "#contracts/enums/misfire.enum";

describe("Misfire", () => {
  it("lists the policies in order", () => {
    expect(Enum.values(Misfire)).toEqual(["catch_up", "once", "skip"]);
  });

  it("names each case", () => {
    expect(Misfire.CatchUp).toBe("catch_up");
    expect(Misfire.Once).toBe("once");
    expect(Misfire.Skip).toBe("skip");
    expectTypeOf<Misfire>().toEqualTypeOf<"catch_up" | "once" | "skip">();
  });
});
