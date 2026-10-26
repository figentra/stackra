/**
 * Stackra file contract:
 * Purpose: `catalogueDecisionOf(version, viewer)`, which decision buttons the plan-catalogue admin offers `viewer` on
 *          `version`: only a pending version (a discount) is decided; its proposer may withdraw it but never approve it.
 * Boundary: pure; internal: the `./react` admin imports it by path. `PlanCatalogueService` enforces the same rules
 *           (SecondApproverRequiredError), so a stale console cannot get past them.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 4); owner OS-381 (second approver).
 */
import { CatalogueVersionState, type CatalogueVersion } from "@stackra/entitlements/contracts";

import type { CatalogueDecision } from "#core/types/catalogue-decision.type";

/**
 * The viewer's choices on one version.
 *
 * @example
 * catalogueDecisionOf(pendingOffer, "usr_rana"); // { canApprove: false, canReject: true, isOwn: true } for its proposer
 */
export function catalogueDecisionOf(
  version: Pick<CatalogueVersion, "state" | "proposedBy">,
  viewer: string,
): CatalogueDecision {
  const isPending = version.state === CatalogueVersionState.Pending;
  const isOwn = version.proposedBy === viewer;
  return Object.freeze({ canApprove: isPending && !isOwn, canReject: isPending, isOwn });
}
