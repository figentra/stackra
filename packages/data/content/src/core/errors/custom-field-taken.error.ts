/**
 * Stackra file contract:
 * Purpose: `CustomFieldTakenError`, the refusal of a custom field whose key the model already has in the scope
 *          (`custom_field_taken`).
 * Boundary: raised by `CustomFieldService.define` when the unique index on scope, model and key refuses the row; kind
 *           `Conflict` (HTTP 409), not retryable. Its details are the model key and the field key the caller sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2); ADR 0140 (envelope and kinds); R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the key stays taken until the other field goes.
 *
 * @example
 * throw CustomFieldTakenError.create({ model: "catalogue.product", key: "shoeSize" });
 */
export class CustomFieldTakenError extends Refusal({ kind: ErrorKind.Conflict, retryable: false }) {
  /** The key of the model the field extends. */
  model!: string;

  /** The field key already defined. */
  key!: string;
}
