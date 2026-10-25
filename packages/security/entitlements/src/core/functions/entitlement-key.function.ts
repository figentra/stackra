/**
 * Stackra file contract:
 * Purpose: `entitlementKey`, the locked key of an entitlement class (`catalogue.product_limit`), for a source whose
 *          grants are keyed by it (the plan service's snapshot, the licence file's entitlement codes).
 * Boundary: reads the registry `registerEntitlements` wrote; the key is derived at build time, so an unregistered
 *           class has none and is refused rather than guessed from its name.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: derived identities); ADR 0178 (decision 6).
 */
import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import type { EntitlementClass } from "#core/types/entitlement-class.type";

/**
 * The locked key of `entitlement`.
 *
 * @throws TypeError when gen has not registered the class.
 * @example
 * entitlementKey(ProductLimitEntitlement); // "catalogue.product_limit"
 */
export function entitlementKey(entitlement: EntitlementClass): string {
  const row = ENTITLEMENT_REGISTRY.get(entitlement);
  if (row === undefined)
    throw new TypeError(
      `${entitlement.name} is not registered: gen's entry calls registerEntitlements for every entitlement`,
    );
  return row.key;
}
