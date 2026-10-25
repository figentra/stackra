/**
 * Stackra file contract:
 * Purpose: the `EntitlementSource` port: where grants come from. In SaaS a driver reads the plan service's event-fed
 *          snapshot (plan, add-ons, overrides and trials composed there); on-prem a driver reads the entitlement codes
 *          of the licence `@stackra/licensing` verified, keyed by `entitlementKey(entitlement)`.
 * Boundary: an abstract class that is its own token. A source answers one entitlement for one scope and composes
 *           nothing: the effective set is the plan service's or the licence's. `undefined` means the right is not in
 *           the plan at all. Feature flags and consent are separate packages and never answer here (ADR 0213).
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 1, 3, 5 and 6); ADR 0178 (decision 6: on-prem reads the licence file); ADR
 *                     0263 (ports resolve by type).
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { EntitlementClass } from "#core/types/entitlement-class.type";
import type { EntitlementGrant } from "#core/types/entitlement-grant.type";

/**
 * Answers the grant of one entitlement for one scope.
 *
 * @example
 * export class LicenceEntitlementSourceDriver extends Driver(EntitlementSource) {
 *   async grant(entitlement: EntitlementClass): Promise<EntitlementGrant | undefined> {
 *     return this.licence.entitlements.includes(entitlementKey(entitlement)) || undefined;
 *   }
 * }
 */
export abstract class EntitlementSource extends Port {
  /**
   * The grant of `entitlement` in `scope`: a boolean for a feature or a module, a count for a limit
   * (`Number.POSITIVE_INFINITY` for no limit), `undefined` when the plan does not include it.
   *
   * @param scope - the id of the call's `ScopeRef`, the scope-tree node it acts in (ADR 0208, ADR 0327); `undefined`
   *                for a platform-wide call. shortcut: the id only, so a source whose plan sits on an ancestor node
   *                reads the path from `ScopeTree`; take the `ScopeRef` once collaboration passes its room's.
   * @throws Error when the source cannot be reached; the call then fails as a bug, never as allowed.
   */
  abstract grant(
    entitlement: EntitlementClass,
    scope: PublicId | undefined,
  ): Promise<EntitlementGrant | undefined>;
}
