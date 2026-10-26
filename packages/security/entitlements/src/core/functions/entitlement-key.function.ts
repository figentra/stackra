/**
 * Stackra file contract:
 * Purpose: `entitlementKey`, the locked key of an entitlement (`catalogue.product_limit`), for a source whose grants are
 *          keyed by it (the plan service's snapshot, the licence file's entitlement codes). Takes the class or a key a
 *          caller already holds (a module key such as `billing`), so both forms resolve to the same grant.
 * Boundary: reads the registry `registerEntitlements` wrote; the key is derived at build time, so an unregistered
 *           class has none and is refused rather than guessed from its name. A key is passed through once its shape
 *           is checked (`<module>` or `<module>.<name>`, snake_case); whether a plan grants it is the source's answer.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: derived identities); ADR 0178 (decision 6); ADR 0131 and 0264 (module
 *                     keys); STA-1225 (grant by key).
 */
import type { EntitlementKey } from "#contracts/types/entitlement-key.type";
import type { EntitlementRef } from "#contracts/types/entitlement-ref.type";
import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import type { EntitlementClass } from "#core/types/entitlement-class.type";

/** A module key, optionally followed by one entitlement name: one snake_case segment each (ADR 0264). */
const KEY_SHAPE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)?$/;

/**
 * The locked key of `entitlement`.
 *
 * @throws TypeError when gen has not registered the class, or a key is not `<module>` or `<module>.<name>`.
 * @example
 * entitlementKey(ProductLimitEntitlement); // "catalogue.product_limit"
 * entitlementKey("billing"); // "billing"
 */
export function entitlementKey(entitlement: EntitlementRef | EntitlementKey): string {
  if (typeof entitlement === "string") {
    if (!KEY_SHAPE.test(entitlement))
      throw new TypeError(
        `${JSON.stringify(entitlement)} is not an entitlement key: <module> or <module>.<name>, snake_case`,
      );
    return entitlement;
  }
  const row = ENTITLEMENT_REGISTRY.get(entitlement as EntitlementClass);
  if (row === undefined)
    throw new TypeError(
      `${entitlement.name} is not registered: gen's entry calls registerEntitlements for every entitlement`,
    );
  return row.key;
}
