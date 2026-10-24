/**
 * Stackra file contract:
 * Purpose: `InputInvalidError` (`input_invalid`), the refusal of a call whose input breaks its schema: the envelope's
 *          `fieldErrors` name each refused path and why.
 * Boundary: thrown by the pipeline's validation, before idempotency, for a class whose input schema gen registered; a
 *           validation refusal (400), never retryable.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (the validation category and `fieldErrors`); ADR 0095 as amended (input schemas).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The input does not match the action's or query's input schema. */
export class InputInvalidError extends Refusal({ kind: ErrorKind.Validation, retryable: false }) {}
