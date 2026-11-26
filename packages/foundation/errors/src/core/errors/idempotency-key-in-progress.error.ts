/**
 * Stackra file contract:
 * Purpose: `IdempotencyKeyInProgressError`, the core refusal when an `Idempotency-Key` was sent again, with the same
 *          body, while the first call with it is still running.
 * Boundary: a core refusal: raised by the idempotency step of the action pipeline (ADR 0138). Kind `Conflict`, code
 *           `idempotency_key_in_progress`, no details. The HTTP adapter answers it `409` with `Retry-After: 1`.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0294 (decisions 16 and 20), ADR 0138 (pipeline order:
 *                     idempotency); STA-2532.
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/** Retryable: the same call replays the first call's answer once that call has finished. */
export class IdempotencyKeyInProgressError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: true,
}) {}
