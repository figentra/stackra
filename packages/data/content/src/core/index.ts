/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/content (the built-in entry types, the registered field types,
 *          the custom field definition, target and value types, the two checks, the refusals, the publication states,
 *          `isPublished` and `slugOf`) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Isomorphic: a browser that imports `ContentEntryType` pulls no
 *           ORM. The definition and value schemas are public under their
 *           generated names (`CustomFieldDefinition$`, `CustomFieldValue$`, STA-1284); the field error mapping stays
 *           internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0116; the STA-347 stand-in barrel decision.
 */
export { CUSTOM_FIELD_DEFINITION_SCHEMA as CustomFieldDefinition$ } from "#core/constants/custom-field-definition-schema.constant";
export { CUSTOM_FIELD_VALUE_SCHEMA as CustomFieldValue$ } from "#core/constants/custom-field-value-schema.constant";
export { ContentEntryType } from "#core/enums/content-entry-type.enum";
export { CustomFieldType } from "#core/enums/custom-field-type.enum";
export { PublicationStatus } from "#core/enums/publication-status.enum";
export { CustomFieldDefinitionInvalidError } from "#core/errors/custom-field-definition-invalid.error";
export { CustomFieldTakenError } from "#core/errors/custom-field-taken.error";
export { CustomFieldsInvalidError } from "#core/errors/custom-fields-invalid.error";
export { checkCustomFieldDefinition } from "#core/functions/check-custom-field-definition.function";
export { checkCustomFields } from "#core/functions/check-custom-fields.function";
export { isPublished } from "#core/functions/is-published.function";
export { slugOf } from "#core/functions/slug-of.function";
export type { CustomFieldChoice } from "#core/types/custom-field-choice.type";
export type { CustomFieldDefinition } from "#core/types/custom-field-definition.type";
export type { CustomFieldTarget } from "#core/types/custom-field-target.type";
export type { CustomFieldValue } from "#core/types/custom-field-value.type";
