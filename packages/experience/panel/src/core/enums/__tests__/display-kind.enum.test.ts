/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DisplayKind`: an `Enum.of` enum whose codes are in source order, with a same-named
 *          type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DisplayKind } from "#core/enums/display-kind.enum";

describe("DisplayKind", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(DisplayKind)).toEqual([
      "kpi",
      "kpi_group",
      "progress",
      "list",
      "view",
      "custom",
    ]);
    expect(DisplayKind.Kpi).toBe("kpi");
  });

  it("types its values", () => {
    expectTypeOf<DisplayKind>().toEqualTypeOf<
      "kpi" | "kpi_group" | "progress" | "list" | "view" | "custom"
    >();
  });
});
