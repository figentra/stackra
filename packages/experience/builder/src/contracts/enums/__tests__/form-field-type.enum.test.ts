/**
 * Stackra file contract:
 * Purpose: unit and type tests of `FormFieldType`: the ten snake_case field type codes, in source order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0128 (`Enum.of`); ADR 0426 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FormFieldType } from "#contracts/enums/form-field-type.enum";

describe("FormFieldType", () => {
  it("lists the ten field types", () => {
    expect(Enum.values(FormFieldType)).toEqual([
      "text",
      "long_text",
      "email",
      "phone",
      "number",
      "money",
      "date",
      "boolean",
      "choice",
      "multi_choice",
    ]);
    expect(FormFieldType.MultiChoice).toBe("multi_choice");
  });

  it("types each case as its literal code", () => {
    expectTypeOf(FormFieldType.LongText).toEqualTypeOf<"long_text">();
  });
});
