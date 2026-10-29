/**
 * Stackra file contract:
 * Purpose: `traceContext(tracer)`, the middleware that sends the current span's W3C `traceparent` on every call, so
 *          the callee's spans join the caller's trace (ADR 0184 decision 1: one trace across services).
 * Boundary: reads `tracer.traceparent()` when each request is sent (the current span then, not when the middleware
 *           was built); outside every span it sends nothing, and a `traceparent` already on the request wins. Put it
 *           outside `retry`, so every attempt carries the same parent.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); ADR 0260 (clients call through the transport); W3C Trace Context.
 */
import type { Tracer } from "@stackra/contracts";

import { TRANSPORT_HEADERS } from "#core/constants/transport-headers.constant";
import { withHeader } from "#core/functions/with-header.function";
import type { Middleware } from "#core/types/middleware.type";

/**
 * Sends `traceparent` from `tracer`.
 *
 * @example
 * createTransport({ middleware: [traceContext(tracer), retry({ attempts: 3 })] });
 */
export function traceContext(tracer: Tracer): Middleware {
  return (request, next) => {
    const traceparent = tracer.traceparent();
    return next(
      traceparent === undefined
        ? request
        : withHeader(request, TRANSPORT_HEADERS.traceparent, traceparent),
    );
  };
}
