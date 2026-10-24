/**
 * Stackra file contract:
 * Purpose: `configRoot`, which finds the configuration class a host override stands in for: the class that extends
 *          the `Config(...)` call directly. Its name gives the key, and a test's values replace it for every injector.
 * Boundary: walks the constructor chain and compares kind records by identity: every class below the called base
 *           shares its record, the kind base above it does not. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20: an override inherits its base's key); ADR 0305 (rule 1).
 */
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { configOptionsOf } from "#core/functions/config-options-of.function";

/**
 * The class directly below the `Config(...)` call in `type`'s chain; `type` itself when it is that class.
 *
 * @throws TypeError when `type` does not extend `Config({ schema })`.
 * @example
 * class LoyaltyKitConfig extends BaseLoyaltyKitConfig { override maxRedeemPercent = 30; }
 * configRoot(LoyaltyKitConfig); // BaseLoyaltyKitConfig
 */
export function configRoot(type: AnyClass): AnyClass {
  configOptionsOf(type); // refuses a class that is not a configuration before the walk
  const record = kindOf(type);
  let current: object = type;
  for (
    let parent = Object.getPrototypeOf(current) as object | null;
    parent !== null && kindOf(Object.getPrototypeOf(parent) as object) === record;
    parent = Object.getPrototypeOf(parent) as object | null
  )
    current = parent;
  return current as AnyClass;
}
