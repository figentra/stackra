/**
 * Stackra file contract:
 * Purpose: `RateLimitedError`, the core refusal when the caller made too many calls in the current window.
 * Boundary: a core refusal: raised by the rate-limit step of the generated endpoints; the HTTP adapter adds `Retry-
 *           After`. Kind `RateLimited`, code `rate_limited`, no details, so nothing about the refused call travels with
 *           it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0294 (decisions 16 and 20), ADR 0217 (rate limits)
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/** Retryable: the same call succeeds once the window resets. */
export class RateLimitedError extends Refusal({
  kind: ErrorKind.RateLimited,
  retryable: true,
}) {}
