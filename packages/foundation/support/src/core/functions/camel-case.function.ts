/**
 * Stackra file contract:
 * Purpose: `camelCase`, any naming form to camelCase (a route's id parameter `orderId`, a JSON key).
 * Boundary: public and pure; built on `snakeCase`, so the two never disagree on word breaks.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0231 (JSON keys and query parameters are camelCase);
 *                     stackra-224 (moved from gen).
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
