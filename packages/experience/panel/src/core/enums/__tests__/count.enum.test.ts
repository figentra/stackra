/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Count`: an `Enum.of` enum whose codes are in source order, with a same-named
 *          type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Count } from "#core/enums/count.enum";

describe("Count", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(Count)).toEqual(["estimated", "exact"]);
    expect(Count.Estimated).toBe("estimated");
  });

  it("types its values", () => {
    expectTypeOf<Count>().toEqualTypeOf<"estimated" | "exact">();
  });
});
