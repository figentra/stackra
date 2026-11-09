/**
 * Stackra file contract:
 * Purpose: unit tests of `FieldControl`: an `Enum.of` enum whose codes are in source order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FieldControl } from "#core/enums/field-control.enum";

describe("FieldControl", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(FieldControl)).toEqual([
      "text",
      "textarea",
      "email",
      "password",
      "url",
      "number",
      "money",
      "select",
      "multi-select",
      "radio",
      "switch",
      "checkbox",
      "date",
      "date-range",
      "time",
      "slider",
      "combo-box",
      "entity",
      "upload",
      "repeater",
      "setting",
    ]);
    expect(FieldControl.TextArea).toBe("textarea");
  });
});
