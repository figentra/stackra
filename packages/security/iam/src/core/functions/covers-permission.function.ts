/**
 * Stackra file contract:
 * Purpose: `coversPermission(held, key)`, whether a held permission entry covers a permission key: the same key, the
 *          whole wildcard `*`, a prefix wildcard (`orders.*`), or a selector by kind or risk (`@read`,
 *          `orders.@risk:l3`, see `selectsPermission`).
 * Boundary: pure and internal; compares whole segments, so `orders.*` does not cover `orders_kit.order.read`. Whether a
 *           wildcard may count at all is the caller's rule (only in system roles, ADR 0132 decision 5); a selector counts in
 *           any role, because it never picks a system or restricted permission (ADR 0407).
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (decisions 2 and 5); ADR 0407 (selectors, STA-818).
 */
import { selectsPermission } from "#core/functions/selects-permission.function";

/**
 * Whether `held` covers `key`; `deny` is set for a deny rule's entry (see `selectsPermission`).
 *
 * @example
 * coversPermission("orders.*", "orders.order.cancel"); // true
 * coversPermission("orders.order.read", "orders.order.cancel"); // false
 * coversPermission("@read", "orders.order.read"); // true when registered at L0 or L1
 */
export function coversPermission(held: string, key: string, deny = false): boolean {
  if (held === "*" || held === key) return true;
  if (held.includes("@")) return selectsPermission(held, key, deny);
  return held.endsWith(".*") && key.startsWith(held.slice(0, -1));
}
