/**
 * Stackra file contract:
 * Purpose: `retry`, the middleware that sends a request again after a network failure, a timeout or a retryable
 *          refusal status, up to a number of attempts.
 * Boundary: repeats only a request that is safe to repeat: a `GET`, `HEAD`, `OPTIONS`, `PUT` or `DELETE`, or any
 *           request carrying an `Idempotency-Key`; a `POST` or `PATCH` without one is sent once, whatever the
 *           options. The statuses come from `ErrorKind` (429, 503); a refusal whose envelope says
 *           `retryable: false`, or a `Retry-After` beyond `maxWait`, is returned as it is. Every attempt but the last
 *           sends a clone, so the body is read once per attempt. A caller's abort ends a wait at once, and the next
 *           attempt then fails with the platform's abort error.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (retryable kinds, decision 3); ADR 0138 (idempotency); ADR 0217 (`Retry-After`).
 */
import { Duration } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";

import { IDEMPOTENT_METHODS } from "#core/constants/idempotent-methods.constant";
import { RETRYABLE_STATUSES } from "#core/constants/retryable-statuses.constant";
import { TRANSPORT_HEADERS } from "#core/constants/transport-headers.constant";
import { RequestTimedOutError } from "#core/errors/request-timed-out.error";
import type { Middleware } from "#core/types/middleware.type";
import type { RetryOptions } from "#core/types/retry-options.type";

/** 200 ms, doubling per attempt, at most 5 s. */
const backoff = (attempt: number): Duration =>
  Duration.seconds(Math.min(0.2 * 2 ** (attempt - 1), 5));

/**
 * Retries what is safe to repeat.
 *
 * @example
 * createTransport({ middleware: [idempotencyKey(), retry({ attempts: 3 }), timeout(Duration.seconds(10))] });
 * @throws RangeError when `attempts` is not a whole number of at least 1.
 */
export function retry(options: RetryOptions): Middleware {
  const { attempts, network = true, refused = true, delay = backoff } = options;
  if (!Number.isInteger(attempts) || attempts < 1)
    throw new RangeError(`retry needs a whole number of attempts of at least 1, got ${attempts}`);
  const maxWait = Duration.toMilliseconds(options.maxWait ?? Duration.seconds(30));
  return async (request, next) => {
    if (!isSafeToRepeat(request)) return next(request);
    for (let attempt = 1; ; attempt++) {
      const last = attempt >= attempts;
      let response: Response;
      try {
        response = await next(last ? request : request.clone());
      } catch (error) {
        if (last || !network || request.signal.aborted || !isNetworkFailure(error)) throw error;
        await wait(Duration.toMilliseconds(delay(attempt)), request.signal);
        continue;
      }
      if (last || !refused || !RETRYABLE_STATUSES.has(response.status)) return response;
      const after = retryAfter(response) ?? Duration.toMilliseconds(delay(attempt));
      if (after > maxWait || (await refusesRetry(response))) return response;
      await response.body?.cancel();
      await wait(after, request.signal);
    }
  };
}

/** An idempotent method, or any method with an `Idempotency-Key`. */
function isSafeToRepeat(request: Request): boolean {
  return (
    IDEMPOTENT_METHODS.has(request.method.toUpperCase()) ||
    request.headers.has(TRANSPORT_HEADERS.idempotencyKey)
  );
}

/** A fetch failure (the platform rejects with `TypeError`) or the transport's own timeout. */
function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError || isRefusal(error, RequestTimedOutError);
}

/** `Retry-After` in milliseconds (seconds or an HTTP date), or `undefined` when absent or unreadable. */
function retryAfter(response: Response): number | undefined {
  const value = response.headers.get(TRANSPORT_HEADERS.retryAfter)?.trim();
  if (value === undefined || value === "") return undefined;
  if (/^\d+$/.test(value)) return Number(value) * 1000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

/** Whether the response's error envelope says the call must not be repeated. */
async function refusesRetry(response: Response): Promise<boolean> {
  try {
    const body: unknown = await response.clone().json();
    return (
      typeof body === "object" &&
      body !== null &&
      (body as { retryable?: unknown }).retryable === false
    );
  } catch {
    return false;
  }
}

/** Resolves after `milliseconds`, or at once when `signal` aborts. */
function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, milliseconds);
    signal.addEventListener("abort", done, { once: true });
    function done(): void {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
  });
}
