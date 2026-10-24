/**
 * Stackra file contract:
 * Purpose: unit tests of `checkCustomFieldDefinition`: a strict definition of each kind passes unchanged; an extra key,
 *          a bad key or locale, a template expression in a label, choices on the wrong type, missing or repeated
 *          choices, bounds on a type that takes none, fractional or too-large lengths and an inverted range are refused
 *          with one field error per path.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0116 (decision CT2); ADR 0226 (enforcement); ADR 0154.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { CustomFieldType } from "#core/enums/custom-field-type.enum";
import { CustomFieldDefinitionInvalidError } from "#core/errors/custom-field-definition-invalid.error";
import { checkCustomFieldDefinition } from "#core/functions/check-custom-field-definition.function";

/** A valid select definition. */
const SHOE_SIZE = {
  key: "shoeSize",
  type: CustomFieldType.Select,
  label: { en: "Shoe size", ar: "مقاس الحذاء" },
  required: true,
  choices: [
    { value: "42", label: { en: "42" } },
    { value: "43", label: { en: "43" } },
  ],
};

/** The field errors `input` is refused with. */
function refusedWith(input: unknown): Readonly<Record<string, string>> | undefined {
  try {
    checkCustomFieldDefinition(input);
  } catch (error) {
    expect(isRefusal(error, CustomFieldDefinitionInvalidError)).toBe(true);
    return (error as CustomFieldDefinitionInvalidError).fieldErrors;
  }
  throw new Error("expected a refusal");
}

describe(checkCustomFieldDefinition, () => {
  it("returns a strict definition unchanged", () => {
    expect(checkCustomFieldDefinition(SHOE_SIZE)).toEqual(SHOE_SIZE);
    const notes = {
      key: "notes",
      type: CustomFieldType.LongText,
      label: { en: "Notes" },
      required: false,
      max: 2000,
    };
    expect(checkCustomFieldDefinition(notes)).toEqual(notes);
    const weight = {
      key: "weightKg",
      type: CustomFieldType.Number,
      label: { en: "Weight" },
      required: false,
      min: 0.5,
      max: 70,
    };
    expect(checkCustomFieldDefinition(weight)).toEqual(weight);
  });

  it("refuses a key it does not know, so no code can ride along", () => {
    expect(refusedWith({ ...SHOE_SIZE, compute: "return 1" })).toEqual({
      compute: "unrecognized_key",
    });
  });

  it("refuses a key that is not camelCase and a label locale that is not a tag", () => {
    expect(refusedWith({ ...SHOE_SIZE, key: "shoe_size" })).toEqual({ key: "invalid_format" });
    expect(
      Object.keys(refusedWith({ ...SHOE_SIZE, label: { English: "Shoe size" } }) ?? {}),
    ).toEqual(["label.English"]);
    expect(refusedWith({ ...SHOE_SIZE, label: {} })).toEqual({ label: "label_required" });
  });

  it("refuses a template expression in a label or a choice label", () => {
    expect(refusedWith({ ...SHOE_SIZE, label: { en: "Size {{ user.name }}" } })).toEqual({
      "label.en": "template_expression",
    });
    const choices = [{ value: "42", label: { en: "${price}" } }];
    expect(refusedWith({ ...SHOE_SIZE, choices })).toEqual({
      "choices.0.label.en": "template_expression",
    });
  });

  it("refuses missing, repeated or misplaced choices", () => {
    const { choices: _, ...noChoices } = SHOE_SIZE;
    expect(refusedWith(noChoices)).toEqual({ choices: "choices_required" });
    const repeated = [SHOE_SIZE.choices[0], SHOE_SIZE.choices[0]];
    expect(refusedWith({ ...SHOE_SIZE, choices: repeated })).toEqual({
      choices: "choices_repeated",
    });
    expect(refusedWith({ ...SHOE_SIZE, type: CustomFieldType.Text })).toEqual({
      choices: "choices_not_allowed",
    });
  });

  it("refuses bounds a type does not take or cannot hold", () => {
    const flag = {
      key: "giftWrap",
      type: CustomFieldType.Boolean,
      label: { en: "Gift wrap" },
      required: false,
    };
    expect(refusedWith({ ...flag, min: 1 })).toEqual({ min: "bound_not_allowed" });
    const title = {
      key: "subtitle",
      type: CustomFieldType.Text,
      label: { en: "Subtitle" },
      required: false,
    };
    expect(refusedWith({ ...title, max: 2.5 })).toEqual({ max: "bound_invalid" });
    expect(refusedWith({ ...title, max: 256 })).toEqual({ max: "too_big" });
    expect(refusedWith({ ...title, min: 10, max: 5 })).toEqual({ min: "range_invalid" });
    const sizes = { ...SHOE_SIZE, type: CustomFieldType.MultiSelect, max: 3 };
    expect(refusedWith(sizes)).toEqual({ max: "too_big" });
  });

  it("refuses a value of the wrong type with zod's code", () => {
    expect(refusedWith({ ...SHOE_SIZE, required: "yes" })).toEqual({ required: "invalid_type" });
    expect(refusedWith({ ...SHOE_SIZE, type: "rich_text" })).toEqual({ type: "invalid_value" });
    expect(refusedWith("shoeSize")).toEqual({ "(root)": "invalid_type" });
  });
});
