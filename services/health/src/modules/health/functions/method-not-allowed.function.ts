/**
 * Stackra file contract:
 * Purpose: `methodNotAllowed()`, the 405 answer to a method a probe does not serve, with the `Allow` header.
 * Boundary: pure; builds a response.
 * Runtime: node
 * Governing contract: ADR 0190 (health); http-conventions (raw endpoints).
 */

/**
 * The 405 answer of a probe.
 *
 * @example
 * methodNotAllowed().headers.get("allow"); // "GET, HEAD"
 */
export function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ error: "method_not_allowed" }), {
    status: 405,
    headers: {
      allow: "GET, HEAD",
      "cache-control": "no-store",
      "content-type": "application/json",
    },
  });
}
