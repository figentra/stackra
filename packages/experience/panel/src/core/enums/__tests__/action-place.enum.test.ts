/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ActionPlace`: an `Enum.of` enum whose codes are in source order, with a same-named
 *          type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ActionPlace } from "#core/enums/action-place.enum";

describe("ActionPlace", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(ActionPlace)).toEqual([
      "row",
      "view",
      "edit",
      "bulk",
      "list_header",
      "empty",
    ]);
    expect(ActionPlace.Row).toBe("row");
  });

  it("types its values", () => {
    expectTypeOf<ActionPlace>().toEqualTypeOf<
      "row" | "view" | "edit" | "bulk" | "list_header" | "empty"
    >();
  });
});
