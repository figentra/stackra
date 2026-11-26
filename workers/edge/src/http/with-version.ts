/**
 * Stackra file contract:
 * Purpose: `withVersion`: one response with `x-stackra-version` naming the Worker version that answered (the
 *          `CF_VERSION_METADATA` binding's id), so a deploy's smoke can prove a version override reached the version
 *          under test and did not fall through to the one serving (STA-2783, ADR 0536 gate 2).
 * Boundary: replaces any `x-stackra-version` the origin sent; leaves a response alone when the binding gives no id
 *           and a WebSocket upgrade (101), whose response cannot be rebuilt.
 * Runtime: worker
 * Governing contract: ADR 0536; ADR 0437.
 */

/** The header the deploy smoke reads (tools/scripts/worker-smoke.mjs VERSION_HEADER). */
const VERSION_HEADER = "x-stackra-version";

/**
 * `response` naming `version` in its version header.
 *
 * @example
 * withVersion(new Response("ok"), "dc8dcd28-271b-4367-9840-6c244f84cb40").headers.get("x-stackra-version");
 */
export function withVersion(response: Response, version: string | undefined): Response {
  if (!version || response.status === 101) return response;
  const out = new Response(response.body, response);
  out.headers.set(VERSION_HEADER, version);
  return out;
}
