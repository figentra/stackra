/**
 * Stackra file contract:
 * Purpose: the `EntitlementSource` port: where grants come from. In SaaS a driver reads the plan service's event-fed
 *          snapshot (`PlanSnapshotEntitlementSourceDriver` over `PlanSnapshots`); on-prem a driver reads the
 *          entitlement codes of the licence `@stackra/licensing` verified, keyed by `entitlementKey(entitlement)`.
 * Boundary: an abstract class that is its own token, in the leaf entry: its signature names `EntitlementRef`, the
 *           structural form of an entitlement class, or an `EntitlementKey` (a module or feature key) for a caller that
 *           only knows the key; a driver resolves both to the same grant (`entitlementKey` accepts either). A source answers one entitlement for one scope and composes
 *           nothing. `undefined` means the right is not in the plan at all. Feature flags and consent are separate
 *           packages and never answer here (ADR 0213).
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 1, 3, 5 and 6); ADR 0178 (decision 6); ADR 0263; owner round 3 #18; ADR 0131; STA-1225 (grant by key).
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { EntitlementKey } from "#contracts/types/entitlement-key.type";
import type { EntitlementRef } from "#contracts/types/entitlement-ref.type";
import type { LimitGrant } from "#contracts/types/limit-grant.type";

/**
 * Answers the grant of one entitlement for one scope.
 *
 * @example
 * export class LicenceEntitlementSourceDriver extends Driver(EntitlementSource) {
 *   async grant(entitlement: EntitlementRef | EntitlementKey): Promise<boolean | undefined> {
 *     return this.licence.entitlements.includes(entitlementKey(entitlement)) || undefined;
 *   }
 * }
 */
export abstract class EntitlementSource extends Port {
  /**
   * The grant of `entitlement` in `scope`: a boolean for a feature or a module, a count or a soft limit for a limit
   * (`Number.POSITIVE_INFINITY` for no limit), `undefined` when the plan does not include it.
   *
   * @param entitlement - the entitlement class, or its locked key (`billing`, `catalogue.product_limit`).
   * @param scope - the id of the call's `ScopeRef`; `undefined` for a platform-wide call.
   * @throws Error when the source cannot be reached; the call then fails as a bug, never as allowed.
   */
  abstract grant(
    entitlement: EntitlementRef | EntitlementKey,
    scope: PublicId | undefined,
  ): Promise<boolean | number | LimitGrant | undefined>;
}
