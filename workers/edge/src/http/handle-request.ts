/**
 * Stackra file contract:
 * Purpose: `handleRequest`: one request through the edge — resolve the host (unknown is 404), refuse a JWT bearer token
 *          the issuer's keys do not verify (401), strip every inbound edge header, sign the identity headers, request
 *          id, timestamp, method, path and body hash with `signEdgeRequest`, and forward to the origin.
 * Boundary: the Worker never authorises (ADR 0437 decision 1): the token check is an early refusal, the
 *           `Authorization` header is forwarded untouched, and the API still authenticates (its `BearerTokenGuard` or
 *           identity layer). Only a JWT-shaped bearer token is verified here; an opaque one (an API key) and every other
 *           scheme pass to the API. The body is read once to hash it, so it is buffered. The secret is never logged.
 * Runtime: worker
 * Governing contract: ADR 0437 (decisions 2 and 4); ADR 0206 (decision 8); RFC 6750 (`WWW-Authenticate`).
 */
import { signEdgeRequest, verifyBearerToken } from "@stackra/app";
import { EdgeHeader } from "@stackra/app/contracts";

import { resolveHost } from "#src/hosts/resolve-host";
import { stripEdgeHeaders } from "#src/http/strip-edge-headers";
import type { EdgeDeps } from "#src/interfaces/edge-deps.interface";

/** `Bearer <header>.<payload>.<signature>`: a JWT, the only bearer token the edge verifies. */
const BEARER_JWT = /^bearer +([\w-]+\.[\w-]+\.[\w-]*)$/i;

/** Methods that carry no body. */
const BODILESS: ReadonlySet<string> = new Set(["GET", "HEAD"]);

/** The lower-case hex SHA-256 of `bytes`. */
const sha256Hex = async (bytes: Uint8Array<ArrayBuffer>): Promise<string> =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

/**
 * Handles one request at the edge.
 *
 * @example
 * return handleRequest(request, { settings, secret: env.EDGE_SIGNING_SECRET, keys, fetcher: fetch, now, requestId });
 */
export async function handleRequest(request: Request, deps: EdgeDeps): Promise<Response> {
  const url = new URL(request.url);
  const host = resolveHost(deps.settings.hosts, url.hostname);
  if (host === null) return new Response("Not found", { status: 404 });

  const token = BEARER_JWT.exec(request.headers.get("authorization")?.trim() ?? "")?.[1];
  if (token !== undefined) {
    const claims = await verifyBearerToken(token, {
      issuer: deps.settings.issuer,
      audience: deps.settings.audience,
      leewaySeconds: deps.settings.leewaySeconds,
      now: deps.now(),
      keys: deps.keys,
    });
    if (claims === undefined)
      return new Response(null, {
        status: 401,
        headers: { "www-authenticate": 'Bearer error="invalid_token"' },
      });
  }

  const method = request.method.toUpperCase();
  const body = BODILESS.has(method) ? null : new Uint8Array(await request.arrayBuffer());
  const path = url.pathname + url.search;
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
  const headers = stripEdgeHeaders(request.headers);
  if (input.scope !== null) headers.set(EdgeHeader.Scope, input.scope);
  headers.set(EdgeHeader.Product, input.product);
  headers.set(EdgeHeader.Surface, input.surface);
  headers.set(EdgeHeader.Realm, input.realm);
  headers.set(EdgeHeader.RequestId, input.requestId);
  headers.set(EdgeHeader.Timestamp, String(input.timestamp));
  headers.set(EdgeHeader.Signature, await signEdgeRequest(input, deps.secret));
  return deps.fetcher(
    new Request(new URL(path, deps.settings.origin), {
      method,
      headers,
      body,
      redirect: "manual",
    }),
  );
}
