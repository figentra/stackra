/**
 * Stackra file contract:
 * Purpose: `AutomationInvalidError`, the refusal of an automation document (or a plan) that does not fit its shape or
 *          the registry: a 400 whose field errors name each refused place by its path (`steps.1.block`).
 * Boundary: a refusal of user- or agent-written data; the field errors are snake_case codes (`shape_invalid`,
 *           `block_unknown`, `block_not_trigger`, `block_not_action`, `block_not_waitable`, `ref_invalid`,
 *           `ref_forward`, `when_without_facts`, `when_invalid`, `key_mismatch`) and never echo a refused value.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (enforcement: the validator refuses an unregistered building block); ADR 0140; ADR 0294
 *                     (decision 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * An automation document the engine refuses.
 *
 * @example
 * throw AutomationInvalidError.create({}, { fieldErrors: { "steps.0.block": "block_unknown" } });
 */
export class AutomationInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
