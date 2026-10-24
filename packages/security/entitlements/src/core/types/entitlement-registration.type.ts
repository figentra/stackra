/**
 * Stackra file contract:
 * Purpose: `EntitlementRegistration`, one row gen hands `registerEntitlements`: an action or query class and the
 *          entitlements that gate it.
 * Boundary: a type only. Which entitlement gates which call is derived at build time (a limit gates its counted
 *           model's generated create), and the folders it is derived from are gone at runtime, so this row is how the
 *           plan driver knows it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22: derived identities); ADR 0138 (as amended: the entitlement step).
 */
import type { AnyClass } from "@stackra/container";

import type { EntitlementClass } from "#core/types/entitlement-class.type";

/** The entitlements of one call. */
export interface EntitlementRegistration {
  /** The action or query class. */
  readonly call: AnyClass;

  /** The entitlements the tenant's plan must grant for the call to run. */
  readonly entitlements: readonly EntitlementClass[];
}
