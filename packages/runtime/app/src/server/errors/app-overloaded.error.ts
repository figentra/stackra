/**
 * Stackra file contract:
 * Purpose: `AppOverloadedError`, the refusal `ServerApp.handlers.run` answers when the instance sheds load: every place
 *          of `HttpConfig.maxConcurrentCalls` is taken and the queue (`maxQueuedCalls`) is full, or a queued call got
 *          no place within `maxQueueWaitMs`. The call never started, so it is safe to send again (503, retryable).
 * Boundary: a refusal, so nobody reports it; code `app_overloaded`. `handlers.shed` answers it as 503 with its envelope
 *           and `Retry-After` from `retryAfterMs`. Its only detail is that wait, never the call, its caller or a count.
 * Runtime: node
 * Governing contract: ADR 0140 (error envelope and kinds: `Unavailable` is 503 and retryable); ADR 0295 (decision 8:
 *                     the adapters reach the member through `handlers`); STA-1467.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The server is at capacity and turned the call away before it started.
 *
 * @example
 * throw AppOverloadedError.create({ retryAfterMs: 1000 });
 */
export class AppOverloadedError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** How long the caller should wait before it sends the call again, in milliseconds. */
  retryAfterMs?: number;
}
