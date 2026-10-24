/**
 * Stackra file contract:
 * Purpose: `RequestTimedOutError`, the refusal `timeout` throws when no response arrived within its duration.
 * Boundary: kind `Unavailable`, code `request_timed_out`, retryable (the call may succeed later, and `retry` repeats
 *           it when the request is safe to repeat). Its one detail is the duration that ran out, never a URL or body;
 *           the abort error that ended the fetch is its `cause`. `@stackra/clients` maps it to its transport error.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0232, ADR 0294 (decisions 16 and 20).
 */
import type { Duration } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/** Retryable: a slow dependency may answer the next attempt. */
export class RequestTimedOutError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The time the request was given (`PT30S`). */
  timeout!: Duration;
}
