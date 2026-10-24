/**
 * Stackra file contract:
 * Purpose: `IdempotencyKeyRequiredError` (`idempotency_key_required`), the refusal of a call to an action declared
 *          `idempotency: Idempotency.Required` that sent no Idempotency-Key.
 * Boundary: thrown by the pipeline's idempotency step before anything is claimed or run; a validation refusal (400).
 *           The generated SDKs always send a key, so only a hand-written client meets it.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3: a key is required for client writes); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The action requires an Idempotency-Key and the call sent none. */
export class IdempotencyKeyRequiredError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
