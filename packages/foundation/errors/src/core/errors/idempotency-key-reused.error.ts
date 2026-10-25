/**
 * Stackra file contract:
 * Purpose: `IdempotencyKeyReusedError`, the core refusal when an `Idempotency-Key` was sent again with a different
 *          body.
 * Boundary: a core refusal: raised by the idempotency step of the action pipeline (ADR 0138), which deduplicates
 *           repeats with the same body. Kind `Conflict`, code `idempotency_key_reused`, no details, so nothing about
 *           the refused call travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0294 (decisions 16 and 20), ADR 0138 (pipeline order:
 *                     idempotency)
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/** Not retryable: send a new key for a different body. */
export class IdempotencyKeyReusedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {}
