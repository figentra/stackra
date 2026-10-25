/**
 * Stackra file contract:
 * Purpose: `OutcomeInvalidError`, the refusal of outcomes that are not registered kinds with fitting parameters: a 400
 *          whose field errors name each refused outcome or parameter by its path (`0`, `1.params.days`).
 * Boundary: a refusal of user-written data; the field errors are snake_case codes (`node_invalid`, `kind_unknown`,
 *           `param_unknown`, `param_missing`, `value_invalid`, `too_many_outcomes`) and never echo a refused value.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 9 and 10); ADR 0140 (error envelope); ADR 0294 (decision 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Outcomes the engine refuses.
 *
 * @example
 * throw OutcomeInvalidError.create({}, { fieldErrors: { "0.params.days": "value_invalid" } });
 */
export class OutcomeInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
