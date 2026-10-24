/**
 * Stackra file contract:
 * Purpose: `idempotencyKey`, the middleware that gives every write one `Idempotency-Key`, so a retry or a replay is
 *          the same call to the action pipeline's idempotency step.
 * Boundary: mints a key only for a method that is not safe (`POST`, `PUT`, `PATCH`, `DELETE`) and only when the
 *           request has none, so a key the offline queue minted is kept. Place it outside `retry`, so every attempt
 *           carries the same key. The default key is `crypto.randomUUID()`; pass `mint` where that is missing
 *           (Hermes without a crypto polyfill).
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (pipeline order: idempotency); the HTTP conventions rule (non-GET takes the header).
 */
import { SAFE_METHODS } from "#core/constants/safe-methods.constant";
import { TRANSPORT_HEADERS } from "#core/constants/transport-headers.constant";
import { withHeader } from "#core/functions/with-header.function";
import type { Middleware } from "#core/types/middleware.type";

/**
 * Adds an `Idempotency-Key` to a write that has none.
 *
 * @example
 * createTransport({ middleware: [idempotencyKey(), retry({ attempts: 3 })] });
 */
export function idempotencyKey(
  mint: () => string = () => globalThis.crypto.randomUUID(),
): Middleware {
  return (request, next) =>
    SAFE_METHODS.has(request.method.toUpperCase()) ||
    request.headers.has(TRANSPORT_HEADERS.idempotencyKey)
      ? next(request)
      : next(withHeader(request, TRANSPORT_HEADERS.idempotencyKey, mint()));
}
