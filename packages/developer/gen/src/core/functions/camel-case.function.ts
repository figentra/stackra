/**
 * Stackra file contract:
 * Purpose: `camelCase`, the snake_case-to-camelCase conversion that names a route's id parameter (`orderId`).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (JSON keys and query parameters are camelCase); ADR 0294 (decision 21).
 */
import { snakeCase } from "#core/functions/snake-case.function";

/**
 * The camelCase form of `name`.
 *
 * @example
 * camelCase("product_collection"); // "productCollection"
 * camelCase("LoyaltyAccount"); // "loyaltyAccount"
 */
export function camelCase(name: string): string {
  return snakeCase(name).replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}
