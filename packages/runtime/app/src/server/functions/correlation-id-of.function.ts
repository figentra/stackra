/**
 * Stackra file contract:
 * Purpose: `correlationIdOf(request, traceId?)`, the one id a call's error answer and its `ErrorReporter` report both
 *          carry (the envelope's `correlationId`, ADR 0140): the edge's request id, else the trace id of the request's
 *          W3C `traceparent`, else the runtime's trace id the adapter passes (Encore's), else a fresh `req_` id.
 * Boundary: pure apart from minting. A header value is taken only when it is a plain id (word characters, `.`, `:`,
 *           `-`, at most 128), so nothing a caller sends is echoed into a body or a report as it came; an all-zero
 *           trace id is not a trace. It reads no other header and decides no status.
 * Runtime: node
 * Governing contract: ADR 0140 (decision 1: `correlationId`); ADR 0184 (decision 1: the edge's request id on every
 *                     span); ADR 0437 (the signed request id); W3C Trace Context (`traceparent`).
 */
import { mintPublicId } from "@stackra/contracts";

import { EdgeHeader } from "#contracts/enums/edge-header.enum";

/** An id safe to echo: word characters, dots, colons and dashes, 1 to 128 of them. */
const PLAIN_ID = /^[\w.:-]{1,128}$/;

/** A W3C `traceparent`: version, a 32-hex trace id, a 16-hex parent span id, flags. */
const TRACEPARENT = /^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/;

/** The invalid trace id of the W3C spec. */
const NO_TRACE = "0".repeat(32);

/**
 * The correlation id of `request`.
 *
 * @param traceId - the runtime's own trace id of this request, when it has one (`currentRequest()?.trace?.traceId`).
 * @example
 * correlationIdOf(request, currentRequest()?.trace?.traceId); // "req-7f3a" (the edge's), or a trace id, or "req_01j…"
 */
export function correlationIdOf(request: Request, traceId?: string): string {
  const requestId = request.headers.get(EdgeHeader.RequestId);
  if (requestId !== null && PLAIN_ID.test(requestId)) return requestId;
  const trace = TRACEPARENT.exec(
    request.headers.get("traceparent")?.trim().toLowerCase() ?? "",
  )?.[1];
  if (trace !== undefined && trace !== NO_TRACE) return trace;
  if (traceId !== undefined && PLAIN_ID.test(traceId)) return traceId;
  return mintPublicId("req");
}
