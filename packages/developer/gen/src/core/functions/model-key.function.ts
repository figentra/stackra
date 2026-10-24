/**
 * Stackra file contract:
 * Purpose: `modelKey`, the identity of a model: `<module>.<snake(Class)>`.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: model key).
 */
import { snakeCase } from "#core/functions/snake-case.function";

/**
 * The key of a model class.
 *
 * @example
 * modelKey("orders", "OrderLine"); // "orders.order_line"
 */
export function modelKey(module: string, className: string): string {
  return `${module}.${snakeCase(className)}`;
}
