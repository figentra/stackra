/**
 * Stackra file contract:
 * Purpose: unit and type tests of `WidgetSize`: an `Enum.of` enum whose codes are in source order, with its case
 *          data and a same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { WidgetSize } from "#core/enums/widget-size.enum";

describe("WidgetSize", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(WidgetSize)).toEqual(["small", "medium", "large", "full"]);
  });

  it("carries its case data", () => {
    expect(Enum.meta(WidgetSize, WidgetSize.Small).columns).toBe(3);
    expect(Enum.meta(WidgetSize, WidgetSize.Full).columns).toBe(12);
  });

  it("types its values", () => {
    expectTypeOf<WidgetSize>().toEqualTypeOf<"small" | "medium" | "large" | "full">();
  });
});
