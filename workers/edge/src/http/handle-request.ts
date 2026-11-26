/**
 * Stackra file contract:
 * Purpose: `handleRequest`: one request through the edge — resolve the host (unknown is 404), refuse a JWT bearer token
 *          the issuer's keys do not verify (401), strip every inbound edge header, sign the identity headers, request
 *          id, timestamp, method, path and body hash with `signEdgeRequest`, and forward to the origin. Every answer,
 *          the edge's own included, leaves with the surface's security headers and policy (`withSecurityHeaders`).
 * Boundary: the Worker never authorises (ADR 0437 decision 1): the token check is an early refusal, the
 *           `Authorization` header is forwarded untouched, and the API still authenticates (its `BearerTokenGuard` or
 *           identity layer). Only a JWT-shaped bearer token is verified here; an opaque one (an API key) and every other
 *           scheme pass to the API. The body is read once to hash it, so it is buffered. The secret is never logged.
 * Runtime: worker
 * Governing contract: ADR 0437 (decisions 2 and 4); ADR 0206 (decision 8); RFC 6750 (`WWW-Authenticate`).
 */
import { verifyBearerToken } from "@stackra/app";
import type { CspConfig } from "@stackra/csp";

import { resolveHost } from "#src/hosts/resolve-host";
import { signedHeaders } from "#src/http/signed-headers";
import { withSecurityHeaders } from "#src/http/with-security-headers";
import type { EdgeDeps } from "#src/interfaces/edge-deps.interface";
import type { HostEntry } from "#src/interfaces/host-entry.interface";

/** `Bearer <header>.<payload>.<signature>`: a JWT, the only bearer token the edge verifies. */
const BEARER_JWT = /^bearer +([\w-]+\.[\w-]+\.[\w-]*)$/i;

/** Methods that carry no body. */
const BODILESS: ReadonlySet<string> = new Set(["GET", "HEAD"]);

/** No framer to resolve: the edge's own answers (404, 401) are never framed. */
const NONE = (): Promise<undefined> => Promise.resolve(undefined);

/** The policy of `host`'s surface, else the baseline. */
const cspOf = (deps: EdgeDeps, host: HostEntry | null): CspConfig =>
  (host === null ? undefined : deps.settings.csp[`${host.product}.${host.surface}`]) ??
  deps.settings.baselineCsp;

/**
 * Handles one request at the edge.
 *
 * @example
 * return handleRequest(request, { settings, secret: env.EDGE_SIGNING_SECRET, keys, fetcher: fetch, now, requestId, frameAncestors });
 */
export async function handleRequest(request: Request, deps: EdgeDeps): Promise<Response> {
  const url = new URL(request.url);
  const host = resolveHost(deps.settings.hosts, url.hostname);
  if (host === null)
    return withSecurityHeaders(
      new Response("Not found", { status: 404 }),
      cspOf(deps, null),
      url.pathname,
      NONE,
    );

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
      return withSecurityHeaders(
        new Response(null, {
          status: 401,
          headers: { "www-authenticate": 'Bearer error="invalid_token"' },
        }),
        cspOf(deps, host),
        url.pathname,
        NONE,
      );
  }

  const method = request.method.toUpperCase();
  const body = BODILESS.has(method) ? null : new Uint8Array(await request.arrayBuffer());
  const path = url.pathname + url.search;
  const headers = await signedHeaders(request.headers, host, method, path, body, deps);
  const response = await deps.fetcher(
    new Request(new URL(path, deps.settings.origin), {
      method,
      headers,
      body,
      redirect: "manual",
    }),
  );
  return withSecurityHeaders(response, cspOf(deps, host), url.pathname, () =>
    deps.frameAncestors.resolve(host, url.hostname, url.pathname),
  );
}
