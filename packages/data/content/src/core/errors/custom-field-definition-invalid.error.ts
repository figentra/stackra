/**
 * Stackra file contract:
 * Purpose: `CustomFieldDefinitionInvalidError`, the refusal of a custom field definition that is not strict data of a
 *          registered type (`custom_field_definition_invalid`).
 * Boundary: raised by `checkCustomFieldDefinition` and `CustomFieldService.define`; kind `Validation` (HTTP 400), not
 *           retryable. It declares no details: its `fieldErrors` map each refused path (`choices`, `label.en`) to a
 *           snake_case code, so a form shows them on their fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2); ADR 0154; ADR 0140 (envelope, kinds, field errors); R-02 (typed
 *                     `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the same definition is refused again.
 *
 * @example
 * throw CustomFieldDefinitionInvalidError.create({}, { fieldErrors: { choices: "choices_required" } });
 */
export class CustomFieldDefinitionInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
