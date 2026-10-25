/**
 * Stackra file contract:
 * Purpose: `coversPermission(held, key)`, whether a held permission entry covers a permission key: the same key, the
 *          whole wildcard `*`, or a prefix wildcard (`orders.*`).
 * Boundary: pure and internal; compares whole segments, so `orders.*` does not cover `orders_kit.order.read`. Whether a
 *           wildcard may count at all is the caller's rule (only in system roles, ADR 0132 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (decisions 2 and 5).
 */

/**
 * Whether `held` covers `key`.
 *
 * @example
 * coversPermission("orders.*", "orders.order.cancel"); // true
 * coversPermission("orders.order.read", "orders.order.cancel"); // false
 */
export function coversPermission(held: string, key: string): boolean {
  if (held === "*" || held === key) return true;
  return held.endsWith(".*") && key.startsWith(held.slice(0, -1));
}
