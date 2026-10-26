/**
 * Stackra file contract:
 * Purpose: `PlanSnapshotEntitlementSourceDriver`, the SaaS `EntitlementSource`: answers an entitlement's grant from
 *          the scope's plan snapshot, by the entitlement's locked key; a caller holding only the key (a module key)
 *          gets the same grant as one holding the class.
 * Boundary: reads `PlanSnapshots` only and composes nothing; the plan service composed the snapshot. A scope with no
 *           plan, or a plan without the key, answers `undefined` (not in the plan). An unregistered entitlement class
 *           throws (`entitlementKey`), never guessed.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 1, 3, 5 and 6); owner round 3 #18 (`EntitlementSource` and a driver);
 *                     STA-1225 (grant by key).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { EntitlementSource } from "#contracts/ports/entitlement-source.port";
import { PlanSnapshots } from "#contracts/ports/plan-snapshots.port";
import type { EntitlementKey } from "#contracts/types/entitlement-key.type";
import type { EntitlementRef } from "#contracts/types/entitlement-ref.type";
import { entitlementKey } from "#core/functions/entitlement-key.function";
import type { EntitlementGrant } from "#core/types/entitlement-grant.type";

/**
 * Grants from the plan snapshot.
 *
 * @example
 * const source = new PlanSnapshotEntitlementSourceDriver(snapshots);
 * await source.grant(ProductLimitEntitlement, acme.id); // 2
 * await source.grant("catalogue.product_limit", acme.id); // 2, the same record
 */
export class PlanSnapshotEntitlementSourceDriver extends Driver(EntitlementSource) {
  /** Where plans come from. */
  private readonly snapshots: PlanSnapshots;

  /** @param snapshots - the event-fed plan of each scope. */
  constructor(snapshots: PlanSnapshots) {
    super();
    this.snapshots = snapshots;
  }

  /**
   * The grant of `entitlement` in `scope`, or `undefined` when its plan does not include it.
   *
   * @throws TypeError when gen has not registered the class, or the key is malformed.
   */
  async grant(
    entitlement: EntitlementRef | EntitlementKey,
    scope: PublicId | undefined,
  ): Promise<EntitlementGrant | undefined> {
    const key = entitlementKey(entitlement);
    const grants = (await this.snapshots.read(scope))?.grants;
    return grants !== undefined && Object.hasOwn(grants, key) ? grants[key] : undefined;
  }
}
