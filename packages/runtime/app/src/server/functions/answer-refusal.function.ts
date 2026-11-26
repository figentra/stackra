/**
 * Stackra file contract:
 * Purpose: `answerRefusal(refusal, correlationId?)`, the HTTP answer of a refusal: its kind's status from
 *          `Enum.meta(ErrorKind, kind).httpStatus` (the one mapping table, ADR 0140 decision 3) and its envelope with the
 *          call's correlation id; a `RateLimitedError` also carries `rateLimitHeaders` (`Retry-After`, `RateLimit-*`)
 *          and an `IdempotencyKeyInProgressError` `Retry-After: 1`.
 * Boundary: pure. It never reports: a refusal is an answer, not a fault. The envelope says only what the refusal's
 *           class declares (code, category, retry flag, details, field errors), never a message or a stack.
 * Runtime: node
 * Governing contract: ADR 0140 (decisions 1 to 3); ADR 0217 (decision 2: the `RateLimit-*` headers); ADR 0138 (the
 *                     idempotency key in progress).
 */
import { Enum } from "@stackra/contracts";
import {
  ErrorKind,
  IdempotencyKeyInProgressError,
  isRefusal,
  RateLimitedError,
  rateLimitHeaders,
} from "@stackra/errors";
import type { Refusal } from "@stackra/errors";

/** The headers a refusal asks the client to honour before it retries. */
function retryHeaders(refusal: Refusal): Record<string, string> {
  if (isRefusal(refusal, RateLimitedError)) return rateLimitHeaders(refusal);
  // the first call with this key is still running: ask the client to retry shortly
  if (isRefusal(refusal, IdempotencyKeyInProgressError)) return { "Retry-After": "1" };
  return {};
}

/**
 * The answer of `refusal`.
 *
 * @example
 * answerRefusal(OrderLockedError.create(), "req-7f3a"); // 409 { code: "order_locked", category: "conflict", retryable: false, correlationId: "req-7f3a" }
 */
export function answerRefusal(refusal: Refusal, correlationId?: string): Response {
  return Response.json(refusal.toEnvelope(correlationId === undefined ? {} : { correlationId }), {
    status: Enum.meta(ErrorKind, refusal.kind).httpStatus,
    headers: retryHeaders(refusal),
  });
}
