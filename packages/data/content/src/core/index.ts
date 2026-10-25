/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/content (the built-in entry types, the registered field types,
 *          the custom field definition and value types, the two checks and the refusals) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Isomorphic: a browser that imports `ContentEntryType` pulls no
 *           ORM. The definition schema and the field error mapping stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0116; the STA-347 stand-in barrel decision.
 */
export { ContentEntryType } from "#core/enums/content-entry-type.enum";
export { CustomFieldType } from "#core/enums/custom-field-type.enum";
export { CustomFieldDefinitionInvalidError } from "#core/errors/custom-field-definition-invalid.error";
export { CustomFieldTakenError } from "#core/errors/custom-field-taken.error";
export { CustomFieldsInvalidError } from "#core/errors/custom-fields-invalid.error";
export { checkCustomFieldDefinition } from "#core/functions/check-custom-field-definition.function";
export { checkCustomFields } from "#core/functions/check-custom-fields.function";
export type { CustomFieldChoice } from "#core/types/custom-field-choice.type";
export type { CustomFieldDefinition } from "#core/types/custom-field-definition.type";
export type { CustomFieldValue } from "#core/types/custom-field-value.type";
