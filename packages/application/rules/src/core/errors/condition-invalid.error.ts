/**
 * Stackra file contract:
 * Purpose: `ConditionInvalidError`, the refusal of a condition that is not a tree of registered fields, their types'
 *          operators and fitting values: a 400 whose field errors name each refused node by its path.
 * Boundary: a refusal of user-written data; the field errors are snake_case codes (`field_unknown`, `operator_not_allowed`,
 *           `value_invalid`, `node_invalid`, `too_deep`, `too_many_nodes`) and never echo a refused value. The root
 *           node's path is `(root)`.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 3, 4 and 10); ADR 0140 (error envelope); ADR 0294 (decision 20: the code
 *                     from the class name).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A condition the engine refuses.
 *
 * @example
 * throw ConditionInvalidError.create({}, { fieldErrors: { "all.0": "operator_not_allowed" } });
 */
export class ConditionInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
