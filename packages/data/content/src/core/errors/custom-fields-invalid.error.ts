/**
 * Stackra file contract:
 * Purpose: `CustomFieldsInvalidError`, the refusal of a record's custom field values that the stored definitions do not
 *          accept (`custom_fields_invalid`): an unknown key, a missing required value or a value of the wrong shape.
 * Boundary: raised by `checkCustomFields` and `CustomFieldService.write`; kind `Validation` (HTTP 400), not retryable.
 *           It declares no details: its `fieldErrors` map each refused field key to a snake_case code and never echo
 *           the value.
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2: values validated by the stored field schema); ADR 0140; R-02.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the same values are refused again.
 *
 * @example
 * throw CustomFieldsInvalidError.create({}, { fieldErrors: { shoeSize: "invalid_value" } });
 */
export class CustomFieldsInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
