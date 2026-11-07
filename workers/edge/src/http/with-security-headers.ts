/**
 * Stackra file contract:
 * Purpose: `withSecurityHeaders`: one response with the surface's security headers (`securityHeaders`) and, unless the
 *          origin sent its own policy, its Content Security Policy (`contentSecurityPolicy`, under `cspHeaderName`).
 *          On a path whose `frameAncestors` entry is `"request"`, the resolver is asked for this request's framers.
 * Boundary: fails closed: a resolver that throws, answers nothing or answers an origin `frameAncestorOrigin` refuses
 *           leaves `frame-ancestors 'none'` and `X-Frame-Options: DENY`. Both headers get the same additions, so they
 *           never disagree. An origin's own policy wins because only the origin knows its nonce; the edge's headers
 *           replace the origin's same-named security headers.
 * Runtime: worker
 * Governing contract: ADR 0237 (edge headers); ADR 0334 rule 12; ADR 0437; STA-2562.
 */
import {
  contentSecurityPolicy,
  cspHeaderName,
  frameAncestorOrigin,
  frameAncestorsEntry,
  securityHeaders,
} from "@stackra/csp";
import type { CspConfig } from "@stackra/csp";

/** Policy headers an origin may send itself. */
const POLICY_HEADERS = ["content-security-policy", "content-security-policy-report-only"];

/** The resolver's framers when every one is a valid origin; anything else is none. */
async function resolvedFramers(
  resolve: () => Promise<readonly string[] | undefined>,
): Promise<readonly string[] | undefined> {
  try {
    const framers = await resolve();
    framers?.forEach(frameAncestorOrigin);
    return framers;
  } catch {
    return undefined;
  }
}

/**
 * `response` with the surface's security headers.
 *
 * @example
 * return withSecurityHeaders(await deps.fetcher(forward), csp, url.pathname, () => resolver.resolve(host, hostname, path));
 */
export async function withSecurityHeaders(
  response: Response,
  csp: CspConfig,
  path: string,
  resolve: () => Promise<readonly string[] | undefined>,
): Promise<Response> {
  const framers =
    frameAncestorsEntry(csp, path) === "request" ? await resolvedFramers(resolve) : undefined;
  const additions = framers === undefined ? { path } : { path, frameAncestors: framers };
  const out = new Response(response.body, response);
  for (const [name, value] of Object.entries(securityHeaders(csp, additions)))
    out.headers.set(name, value);
  if (!POLICY_HEADERS.some((name) => out.headers.has(name)))
    out.headers.set(cspHeaderName(csp), contentSecurityPolicy(csp, additions));
  return out;
}
