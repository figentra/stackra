/**
 * Stackra file contract:
 * Purpose: unit tests of `CustomFieldType`: the registered types in order, and each type's case data (what its bounds
 *          bound, whether it takes choices, its longest stored text).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0116 (decision CT2); ADR 0226 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CustomFieldType } from "#core/enums/custom-field-type.enum";

/** The case data of `type`. */
const meta = (type: CustomFieldType) => Enum.meta(CustomFieldType, type);

describe("CustomFieldType", () => {
  it("lists the registered types in order", () => {
    expect(Enum.values(CustomFieldType)).toEqual([
      "text",
      "long_text",
      "number",
      "boolean",
      "date",
      "select",
      "multi_select",
      "url",
      "email",
    ]);
  });

  it("gives each type its bounds, choices and longest text", () => {
    expect(meta(CustomFieldType.Text)).toEqual({
      bounds: "length",
      choices: false,
      maxLength: 255,
    });
    expect(meta(CustomFieldType.LongText).maxLength).toBe(10_000);
    expect(meta(CustomFieldType.Number).bounds).toBe("value");
    expect(meta(CustomFieldType.Select)).toEqual({ bounds: null, choices: true, maxLength: null });
    expect(meta(CustomFieldType.MultiSelect)).toMatchObject({ bounds: "picks", choices: true });
    expect(meta(CustomFieldType.Url).maxLength).toBe(2048);
    expect(meta(CustomFieldType.Email).maxLength).toBe(254);
    for (const type of [CustomFieldType.Boolean, CustomFieldType.Date])
      expect(meta(type)).toEqual({ bounds: null, choices: false, maxLength: null });
  });
});
