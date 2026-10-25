/**
 * Stackra file contract:
 * Purpose: `matchesEndpoint(call, endpoint)`, whether a recorded request is a call of one manifest endpoint: the same
 *          method, and a path that ends with the endpoint's path, each `:param` matching one segment.
 * Boundary: internal to `./e2e` (not exported); pure. The path is matched as a suffix because the API base URL may
 *           carry a prefix of its own.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0269 (decision 6); ADR 0140 (endpoints).
 */
import type { ApiCall } from "#e2e/api-calls/api-call.type";

/** A path param: `:orderId`. */
const PARAM = /(:[A-Za-z][A-Za-z0-9]*)/;

/**
 * Whether `call` went to `endpoint`.
 *
 * @example
 * matchesEndpoint({ method: "POST", url: "http://localhost/api/orders", headers: {} }, { method: "POST", path: "/orders" }); // true
 */
export function matchesEndpoint(
  call: ApiCall,
  endpoint: { readonly method: string; readonly path: string },
): boolean {
  if (call.method.toUpperCase() !== endpoint.method.toUpperCase()) return false;
  const pattern = endpoint.path
    .split(PARAM)
    .map((part, index) => (index % 2 === 1 ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("");
  return new RegExp(`${pattern}/?$`).test(new URL(call.url).pathname);
}
