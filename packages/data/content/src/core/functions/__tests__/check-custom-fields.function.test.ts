/**
 * Stackra file contract:
 * Purpose: unit and type tests of `checkCustomFields`: values of every registered type pass and come back frozen;
 *          `null` clears an optional field; an unknown key, a missing or null required value, an empty text, an
 *          out-of-range number, an unknown or repeated choice, a script URL and a bad email or date are refused with
 *          one field error per key.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0116 (decision CT2); ADR 0154.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CustomFieldType } from "#core/enums/custom-field-type.enum";
import { CustomFieldsInvalidError } from "#core/errors/custom-fields-invalid.error";
import { checkCustomFields } from "#core/functions/check-custom-fields.function";
import type { CustomFieldDefinition } from "#core/types/custom-field-definition.type";
import type { CustomFieldValue } from "#core/types/custom-field-value.type";

/** A definition of `type` under `key`, optional unless said. */
const field = (
  key: string,
  type: CustomFieldType,
  rest: Partial<CustomFieldDefinition> = {},
): CustomFieldDefinition => ({ key, type, label: { en: key }, required: false, ...rest });

/** Two choices. */
const SIZES = [
  { value: "s", label: { en: "Small" } },
  { value: "l", label: { en: "Large" } },
];

/** One field of every type. */
const DEFINITIONS = [
  field("subtitle", CustomFieldType.Text, { required: true }),
  field("notes", CustomFieldType.LongText),
  field("weight", CustomFieldType.Number, { min: 0, max: 70 }),
  field("giftWrap", CustomFieldType.Boolean),
  field("launchOn", CustomFieldType.Date),
  field("size", CustomFieldType.Select, { choices: SIZES }),
  field("sizes", CustomFieldType.MultiSelect, { choices: SIZES, max: 2 }),
  field("website", CustomFieldType.Url),
  field("contact", CustomFieldType.Email),
];

/** The field errors `values` are refused with. */
function refusedWith(values: unknown): Readonly<Record<string, string>> | undefined {
  try {
    checkCustomFields(DEFINITIONS, values);
  } catch (error) {
    expect(isRefusal(error, CustomFieldsInvalidError)).toBe(true);
    return (error as CustomFieldsInvalidError).fieldErrors;
  }
  throw new Error("expected a refusal");
}

describe(checkCustomFields, () => {
  it("returns values of every type, frozen", () => {
    const values = {
      subtitle: "Handmade",
      notes: "Ships in a box.",
      weight: 1.5,
      giftWrap: true,
      launchOn: "2026-11-01",
      size: "l",
      sizes: ["s", "l"],
      website: "https://example.com/shoes",
      contact: "sales@example.com",
    };
    const checked = checkCustomFields(DEFINITIONS, values);
    expect(checked).toEqual(values);
    expect(Object.isFrozen(checked)).toBe(true);
    expectTypeOf(checked).toEqualTypeOf<Readonly<Record<string, CustomFieldValue>>>();
  });

  it("drops a null optional value and keeps only what was sent", () => {
    expect(checkCustomFields(DEFINITIONS, { subtitle: "Handmade", notes: null })).toEqual({
      subtitle: "Handmade",
    });
  });

  it("refuses an unknown key and a missing or null required value", () => {
    expect(refusedWith({ subtitle: "Handmade", colour: "red" })).toEqual({
      colour: "unrecognized_key",
    });
    expect(refusedWith({})).toEqual({ subtitle: "invalid_type" });
    expect(refusedWith({ subtitle: null })).toEqual({ subtitle: "invalid_type" });
  });

  it("refuses values outside their type's rules, one code per key", () => {
    expect(
      refusedWith({
        subtitle: "",
        weight: 80,
        size: "m",
        sizes: ["s", "s"],
        website: "javascript://alert(1)",
        contact: "sales",
        launchOn: "01/11/2026",
      }),
    ).toEqual({
      subtitle: "too_small",
      weight: "too_big",
      size: "invalid_value",
      sizes: "choices_repeated",
      website: "invalid_format",
      contact: "invalid_format",
      launchOn: "invalid_format",
    });
  });

  it("caps text at its type's length and picks at the definition's max", () => {
    expect(refusedWith({ subtitle: "x".repeat(256) })).toEqual({ subtitle: "too_big" });
    const many = [field("tags", CustomFieldType.MultiSelect, { choices: SIZES, max: 1 })];
    expect(() => checkCustomFields(many, { tags: ["s", "l"] })).toThrow(CustomFieldsInvalidError);
  });

  it("refuses a values payload that is not an object", () => {
    expect(refusedWith(["Handmade"])).toEqual({ "(root)": "invalid_type" });
  });
});
