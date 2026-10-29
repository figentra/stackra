/**
 * Stackra file contract:
 * Purpose: `stripEdgeHeaders`: a copy of a request's headers without any edge header (`EdgeHeader`, the identity,
 *          request-id, timestamp and signature headers) and without `host`.
 * Boundary: pure. A client can send any header, so every inbound edge header is dropped before the Worker sets its own;
 *           the API trusts only the ones this Worker signs.
 * Runtime: worker
 * Governing contract: ADR 0437 (decision 4).
 */
import { EdgeHeader } from "@stackra/app/contracts";
import { Enum } from "@stackra/contracts";

/**
 * `headers` without edge headers or `host`.
 *
 * @example
 * const forwarded = stripEdgeHeaders(request.headers);
 */
export function stripEdgeHeaders(headers: Headers): Headers {
  const copy = new Headers(headers);
  for (const name of Enum.values(EdgeHeader)) copy.delete(name);
  copy.delete("host");
  return copy;
}
