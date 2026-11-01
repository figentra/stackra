/**
 * Stackra file contract:
 * Purpose: `roleKey`, the derived key of a module role: `<module>.<snake name without Role>`.
 * Boundary: pure; the manifest's `roles` section and the registrations both read it, so the key `registerRoles` locks
 *           is the one the manifest names.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 2, as amended by 0294); ADR 0294 (decision 20); STA-1710.
 */
import { snakeCase } from "@stackra/support";

/**
 * The role key of `className` in `module`.
 *
 * @example
 * roleKey("orders", "OrderClerkRole"); // "orders.order_clerk"
 */
export function roleKey(module: string, className: string): string {
  return `${module}.${snakeCase(className.replace(/Role$/, ""))}`;
}
