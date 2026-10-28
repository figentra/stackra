/**
 * Stackra file contract:
 * Purpose: `rateLimitHeaders`, the HTTP headers of a `RateLimitedError`: `Retry-After` and `RateLimit-Reset` (whole
 *          seconds, rounded up), `RateLimit-Limit` and `RateLimit-Remaining`, from the refusal's details.
 * Boundary: pure; any other value (another refusal, a bug) gives no headers, and a detail the refusal does not carry
 *           gives no header, so nothing is ever guessed. The generated HTTP adapter calls it; this package sends
 *           nothing itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: the `RateLimit-*` headers are sent); ADR 0140; STA-1477.
 */
import { RateLimitedError } from "#core/errors/rate-limited.error";
import { isRefusal } from "#core/functions/is-refusal.function";

/**
 * The rate-limit headers of `error`, empty unless it is a `RateLimitedError`.
 *
 * @example
 * rateLimitHeaders(RateLimitedError.create({ retryAfterMs: 2500, limit: 20, remaining: 0 }));
 * // { "Retry-After": "3", "RateLimit-Reset": "3", "RateLimit-Limit": "20", "RateLimit-Remaining": "0" }
 */
export function rateLimitHeaders(error: unknown): Readonly<Record<string, string>> {
  if (!isRefusal(error, RateLimitedError)) return {};
  const { retryAfterMs, limit, remaining } = error as RateLimitedError;
  const headers: Record<string, string> = {};
  if (retryAfterMs !== undefined && Number.isFinite(retryAfterMs)) {
    const seconds = String(Math.max(0, Math.ceil(retryAfterMs / 1000)));
    headers["Retry-After"] = seconds;
    headers["RateLimit-Reset"] = seconds;
  }
  if (limit !== undefined) headers["RateLimit-Limit"] = String(limit);
  if (remaining !== undefined) headers["RateLimit-Remaining"] = String(remaining);
  return headers;
}
