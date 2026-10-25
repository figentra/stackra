/**
 * Stackra file contract:
 * Purpose: `checkCustomFields`, the check a record's custom field values pass against the stored definitions: every key
 *          defined, every required value present, every value of its type's shape and within its bounds and choices.
 * Boundary: untrusted input in, the typed values out, frozen. `null` clears an optional field and is left out of the
 *           result; it is refused for a required one. A text value is never empty (send `null` to clear it), a `url`
 *           is `http` or `https` only, and a `multi_select` repeats no choice. A refusal carries one field error per
 *           refused key and no value. The definitions are trusted: they passed `checkCustomFieldDefinition` when stored.
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2: values validated by the stored field schema); ADR 0154; ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";
import type { ZodType } from "zod";

import { CustomFieldType } from "#core/enums/custom-field-type.enum";
import { CustomFieldsInvalidError } from "#core/errors/custom-fields-invalid.error";
import { fieldErrorsOf } from "#core/functions/field-errors-of.function";
import type { CustomFieldDefinition } from "#core/types/custom-field-definition.type";
import type { CustomFieldValue } from "#core/types/custom-field-value.type";

/** The schema of one definition's value. */
function valueSchemaOf(definition: CustomFieldDefinition): ZodType<CustomFieldValue> {
  const { type, min, max, choices = [] } = definition;
  const values = choices.map(({ value }) => value);
  switch (type) {
    case CustomFieldType.Text:
    case CustomFieldType.LongText:
      return z
        .string()
        .min(min ?? 1)
        .max(max ?? Enum.meta(CustomFieldType, type).maxLength);
    case CustomFieldType.Number:
      return z
        .number()
        .gte(min ?? -Number.MAX_VALUE)
        .lte(max ?? Number.MAX_VALUE);
    case CustomFieldType.Boolean:
      return z.boolean();
    case CustomFieldType.Date:
      return z.iso.date();
    case CustomFieldType.Select:
      return z.enum(values);
    case CustomFieldType.MultiSelect:
      return z
        .array(z.enum(values))
        .min(min ?? 0)
        .max(max ?? values.length)
        .refine((picked) => new Set(picked).size === picked.length, "choices_repeated");
    case CustomFieldType.Url:
      return z.url({ protocol: /^https?$/ }).max(Enum.meta(CustomFieldType, type).maxLength);
    case CustomFieldType.Email:
      return z.email().max(Enum.meta(CustomFieldType, type).maxLength);
  }
}

/**
 * Checks `values` against `definitions`.
 *
 * @param definitions - the stored definitions of the record's model in its scope.
 * @param values - the values as the caller sent them, keyed by field key.
 * @returns the values, typed and frozen, without the cleared ones.
 * @throws CustomFieldsInvalidError when a key is not defined, a required value is missing, or a value breaks its type.
 * @example
 * checkCustomFields([shoeSize, giftWrap], { shoeSize: "42", giftWrap: null }); // { shoeSize: "42" }
 */
export function checkCustomFields(
  definitions: readonly CustomFieldDefinition[],
  values: unknown,
): Readonly<Record<string, CustomFieldValue>> {
  const shape: Record<string, ZodType<CustomFieldValue | null | undefined>> = {};
  for (const definition of definitions) {
    const schema = valueSchemaOf(definition);
    shape[definition.key] = definition.required ? schema : schema.nullish();
  }
  const result = z.strictObject(shape).safeParse(values);
  if (!result.success)
    throw CustomFieldsInvalidError.create({}, { fieldErrors: fieldErrorsOf(result.error) });
  const checked: Record<string, CustomFieldValue> = {};
  for (const [key, value] of Object.entries(result.data))
    if (value !== null && value !== undefined) checked[key] = value;
  return Object.freeze(checked);
}
