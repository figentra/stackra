/**
 * Stackra file contract:
 * Purpose: `signedHeaders`: the headers of one request the edge sends to the origin — the inbound headers with every
 *          edge header stripped, then the host's identity headers, a request id, the timestamp and the
 *          `signEdgeRequest` signature over them, the method, the path and the body hash.
 * Boundary: the signed bytes are `signEdgeRequest`'s only. Used for every forwarded request and for the edge's own
 *           calls to the origin (the frame-ancestor resolver), so the API's `EdgeHeaderGuard` checks both alike.
 * Runtime: worker
 * Governing contract: ADR 0437 (decisions 2 and 4).
 */
import { signEdgeRequest } from "@stackra/app";
import { EdgeHeader } from "@stackra/app/contracts";

import { stripEdgeHeaders } from "#src/http/strip-edge-headers";
import type { EdgeDeps } from "#src/interfaces/edge-deps.interface";
import type { HostEntry } from "#src/interfaces/host-entry.interface";

/** The lower-case hex SHA-256 of `bytes`. */
const sha256Hex = async (bytes: Uint8Array<ArrayBuffer>): Promise<string> =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

/**
 * The signed headers of one request to the origin.
 *
 * @example
 * const headers = await signedHeaders(request.headers, host, "GET", "/api/x", null, deps);
 */
export async function signedHeaders(
  inbound: Headers,
  host: HostEntry,
  method: string,
  path: string,
  body: Uint8Array<ArrayBuffer> | null,
  deps: Pick<EdgeDeps, "secret" | "now" | "requestId">,
): Promise<Headers> {
  const input = {
    scope: host.scope,
    product: host.product,
    surface: host.surface,
    realm: host.realm,
    requestId: deps.requestId(),
    timestamp: Math.floor(deps.now().getTime() / 1000),
    method,
    path,
    bodyHash: await sha256Hex(body ?? new Uint8Array()),
  };
  const headers = stripEdgeHeaders(inbound);
  if (input.scope !== null) headers.set(EdgeHeader.Scope, input.scope);
  headers.set(EdgeHeader.Product, input.product);
  headers.set(EdgeHeader.Surface, input.surface);
  headers.set(EdgeHeader.Realm, input.realm);
  headers.set(EdgeHeader.RequestId, input.requestId);
  headers.set(EdgeHeader.Timestamp, String(input.timestamp));
  headers.set(EdgeHeader.Signature, await signEdgeRequest(input, deps.secret));
  return headers;
}
