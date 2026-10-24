/**
 * Stackra file contract:
 * Purpose: `EntitlementRegistration`, one row gen hands `registerEntitlements`: an entitlement class with the key gen
 *          derived and locked in the manifest, and the action and query classes it gates (the manifest's
 *          `entitlements[].gates`).
 * Boundary: a type only. The key comes from the module folder and the gates from the build (a limit gates its counted
 *           model's generated create; a declared `entitlement` option gates its call), and both are gone at runtime,
 *           so this row is how the plan driver and the sources know them.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22: derived identities, the manifest lock); ADR 0138 (as amended:
 *                     the entitlement step).
 */
import type { AnyClass } from "@stackra/container";

import type { EntitlementClass } from "#core/types/entitlement-class.type";

/** The derived identity of one entitlement and the calls it gates. */
export interface EntitlementRegistration {
  /** The entitlement class. */
  readonly type: EntitlementClass;

  /** The locked key, `<module>.<name>` (`catalogue.product_limit`). */
  readonly key: string;

  /** The action and query classes the scope's plan must grant this entitlement for. */
  readonly gates: readonly AnyClass[];
}
