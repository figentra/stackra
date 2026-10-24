/**
 * Stackra file contract:
 * Purpose: `timeout`, the middleware that aborts a request whose response headers have not arrived within a duration
 *          and throws `RequestTimedOutError` for it.
 * Boundary: times the wait for the response, not the body, so a long NDJSON or event stream is not cut once it has
 *           started. The caller's own abort still cancels the request and its body. Built on `AbortController` and
 *           `setTimeout` only (no `AbortSignal.timeout` or `AbortSignal.any`, which Hermes lacks). Place it inside
 *           `retry`, so every attempt gets the full duration.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (`unavailable` is retryable); ADR 0260 (clients call through the transport).
 */
import { Duration } from "@stackra/contracts";

import { RequestTimedOutError } from "#core/errors/request-timed-out.error";
import type { Middleware } from "#core/types/middleware.type";

/**
 * Gives each request `duration` to answer.
 *
 * @example
 * createTransport({ middleware: [retry({ attempts: 2 }), timeout(Duration.seconds(30))] });
 * @throws RangeError when `duration` is not longer than zero.
 */
export function timeout(duration: Duration): Middleware {
  const milliseconds = Duration.toMilliseconds(duration);
  if (!(milliseconds > 0))
    throw new RangeError(`timeout needs a duration above zero, got "${duration}"`);
  return async (request, next) => {
    const controller = new AbortController();
    // Kept for the life of the response, so the caller can still cancel a streaming body.
    if (request.signal.aborted) controller.abort();
    else request.signal.addEventListener("abort", () => controller.abort(), { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, milliseconds);
    try {
      return await next(new Request(request, { signal: controller.signal }));
    } catch (error) {
      if (timedOut) throw RequestTimedOutError.create({ timeout: duration }, { cause: error });
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
}
