/**
 * Stackra file contract:
 * Purpose: `pagePath`, the path part of a location string (`/orders?page=2#top` to `/orders`), so auto-capture never
 *          sends a query or a hash.
 * Boundary: pure; an empty or relative input becomes `/`-rooted.
 * Runtime: isomorphic
 * Governing contract: analytics gap 9 (stackra-409); ADR 0071 (privacy).
 */

/**
 * The path of `location`, without query or hash, starting with `/`.
 *
 * @example
 * pagePath("/orders?page=2#top"); // "/orders"
 */
export function pagePath(location: string): string {
  const path = location.split(/[?#]/, 1)[0] ?? "";
  return path.startsWith("/") ? path : `/${path}`;
}
