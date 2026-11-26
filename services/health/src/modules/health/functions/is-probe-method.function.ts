/**
 * Stackra file contract:
 * Purpose: `isProbeMethod(request)`, whether a request is a `GET` or a `HEAD`, the only methods a probe answers.
 * Boundary: pure; reads the request's method and nothing else.
 * Runtime: node
 * Governing contract: ADR 0190 (health); http-conventions (raw endpoints).
 */

/**
 * Whether `request` is a probe method.
 *
 * @example
 * isProbeMethod(new Request("http://x/healthz")); // true
 */
export function isProbeMethod(request: Request): boolean {
  return request.method === "GET" || request.method === "HEAD";
}
