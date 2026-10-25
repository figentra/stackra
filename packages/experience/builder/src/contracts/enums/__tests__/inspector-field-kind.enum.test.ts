/**
 * Stackra file contract:
 * Purpose: unit and type tests of `InspectorFieldKind`: the six snake_case kind codes, in source order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { InspectorFieldKind } from "#contracts/enums/inspector-field-kind.enum";

describe("InspectorFieldKind", () => {
  it("lists the six kinds", () => {
    expect(Enum.values(InspectorFieldKind)).toEqual([
      "text",
      "number",
      "boolean",
      "enum",
      "money",
      "localized",
    ]);
  });

  it("types each case as its literal code", () => {
    expectTypeOf(InspectorFieldKind.Money).toEqualTypeOf<"money">();
  });
});
