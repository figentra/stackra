/**
 * Stackra file contract:
 * Purpose: `probeResponse(request, status, body)`, the Fetch `Response` of a health route: JSON, never cached, and no
 *          body for `HEAD`.
 * Boundary: pure; builds a response and reads nothing but the request's method. A probe's answer is a status per
 *           dependency, never a dependency's detail.
 * Runtime: node
 * Governing contract: ADR 0190 (health); http-conventions (raw endpoints).
 */

/**
 * The JSON answer of a probe; a `HEAD` gets the status and headers without the body.
 *
 * @example
 * probeResponse(request, 200, { status: "up" }); // 200 {"status":"up"}, cache-control: no-store
 */
export function probeResponse(
  request: Request,
  status: 200 | 503,
  body: Readonly<Record<string, string>>,
): Response {
  const headers = { "cache-control": "no-store", "content-type": "application/json" };
  return new Response(request.method === "HEAD" ? null : JSON.stringify(body), {
    status,
    headers,
  });
}
