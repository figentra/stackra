/**
 * Stackra file contract:
 * Purpose: `entitlementKey`, the derived identity of an entitlement class: `<module>.` + the snake_case class name
 *          without its `Entitlement` suffix (`TillLimitEntitlement` in `pos` is `pos.till_limit`), the key a plan's
 *          snapshot grants and `registerEntitlements` names.
 * Boundary: pure. Never written by an author (ADR 0294 decision 20); the manifest locks it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); ADR 0215 (decision 1); STA-903.
 */
import { snakeCase } from "#core/functions/snake-case.function";

/**
 * The key of an entitlement class.
 *
 * @example
 * entitlementKey("catalogue", "ProductLimitEntitlement"); // "catalogue.product_limit"
 */
export function entitlementKey(module: string, className: string): string {
  return `${module}.${snakeCase(className.replace(/Entitlement$/, ""))}`;
}
