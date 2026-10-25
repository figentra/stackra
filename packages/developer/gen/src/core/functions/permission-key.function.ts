/**
 * Stackra file contract:
 * Purpose: `permissionKey`, the derived permission of one verb of a Permissions class:
 *          `<module>.<snake(class minus "Permissions")>.<snake(verb)>`.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: permission); ADR 0208 (permission names).
 */
import { snakeCase } from "#core/functions/snake-case.function";

/**
 * The permission key of `verb` on a Permissions class.
 *
 * @example
 * permissionKey("orders", "OrderPermissions", "cancel"); // "orders.order.cancel"
 */
export function permissionKey(module: string, className: string, verb: string): string {
  return `${module}.${snakeCase(className.replace(/Permissions$/, ""))}.${snakeCase(verb)}`;
}
