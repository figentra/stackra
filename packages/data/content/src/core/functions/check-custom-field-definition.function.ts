/**
 * Stackra file contract:
 * Purpose: `checkCustomFieldDefinition`, the check a custom field definition passes before it is stored: strict data of
 *          a registered type, its choices and bounds allowed by that type, its labels free of template expressions.
 * Boundary: untrusted input in, a typed definition out; it never coerces, trims or fills a default. A refusal carries
 *           one field error per refused path and no value.
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2); ADR 0226 (decision 1 and its enforcement); ADR 0154; ADR 0140.
 */
import { CUSTOM_FIELD_DEFINITION_SCHEMA } from "#core/constants/custom-field-definition-schema.constant";
import { CustomFieldDefinitionInvalidError } from "#core/errors/custom-field-definition-invalid.error";
import { fieldErrorsOf } from "#core/functions/field-errors-of.function";
import type { CustomFieldDefinition } from "#core/types/custom-field-definition.type";

/**
 * Checks `input` as a custom field definition.
 *
 * @param input - the definition as the caller sent it.
 * @returns the definition, typed.
 * @throws CustomFieldDefinitionInvalidError when a key is unknown, a value breaks its rule, or the choices and bounds
 *         do not fit the type.
 * @example
 * const definition = checkCustomFieldDefinition({
 *   key: "giftWrap",
 *   type: CustomFieldType.Boolean,
 *   label: { en: "Gift wrap", ar: "تغليف هدية" },
 *   required: false,
 * });
 */
export function checkCustomFieldDefinition(input: unknown): CustomFieldDefinition {
  const result = CUSTOM_FIELD_DEFINITION_SCHEMA.safeParse(input);
  if (!result.success)
    throw CustomFieldDefinitionInvalidError.create(
      {},
      { fieldErrors: fieldErrorsOf(result.error) },
    );
  return result.data;
}
