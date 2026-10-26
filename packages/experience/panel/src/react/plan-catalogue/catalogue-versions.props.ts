/**
 * Stackra file contract:
 * Purpose: `CatalogueVersionsProps`, the props of the plan-catalogue admin's version history: the versions of one
 *          record, the viewer, the instant that decides which version is in force, and the decision handlers.
 * Boundary: types only; the handlers call the OS billing approve and reject actions, which run `PlanCatalogueService`.
 * Runtime: browser
 * Governing contract: ADR 0391 (decisions 2 to 5); owner OS-381.
 */
import type { CatalogueVersion } from "@stackra/entitlements/contracts";

/** Props of `CatalogueVersions`. */
export interface CatalogueVersionsProps {
  /** Every version of the record, in any order (`PlanCatalogueService.history`). */
  readonly versions: readonly CatalogueVersion[];
  /** The viewer's principal id, compared with each proposer for the second-approver rule. */
  readonly viewer: string;
  /** The instant the in-force mark is computed for; now when left out. */
  readonly at?: Date | undefined;
  /** Called to approve a pending version. */
  readonly onApprove: (version: CatalogueVersion) => void;
  /** Called to reject (or, by its proposer, withdraw) a pending version. */
  readonly onReject: (version: CatalogueVersion) => void;
}
