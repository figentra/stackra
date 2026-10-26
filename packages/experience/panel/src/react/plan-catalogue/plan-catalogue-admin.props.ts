/**
 * Stackra file contract:
 * Purpose: `PlanCatalogueAdminProps`, the props of one plan-catalogue record's console page: the record, its versions,
 *          the viewer, the tenant's time zone, and the propose, approve and reject handlers.
 * Boundary: types only; the handlers call the OS billing actions over `PlanCatalogueService` (through the panel's
 *           action runner), and the versions come from its history query.
 * Runtime: browser
 * Governing contract: ADR 0391; owner OS-82, OS-381.
 */
import type { CatalogueProposal } from "@stackra/entitlements";
import type { CatalogueVersion } from "@stackra/entitlements/contracts";

/** Props of `PlanCatalogueAdmin`. */
export interface PlanCatalogueAdminProps {
  /** The record key (`plan-catalogue:commerce`, `price-list:commerce`). */
  readonly recordKey: string;
  /** The record kind. */
  readonly kind: string;
  /** Every version of the record. */
  readonly versions: readonly CatalogueVersion[];
  /** The viewer's principal id. */
  readonly viewer: string;
  /** The tenant's IANA time zone (a setting). */
  readonly timeZone: string;
  /** The instant the in-force version is shown for; now when left out. */
  readonly at?: Date | undefined;
  /** Called with a new proposal. */
  readonly onPropose: (proposal: CatalogueProposal) => void;
  /** Called to approve a pending version. */
  readonly onApprove: (version: CatalogueVersion) => void;
  /** Called to reject or withdraw a pending version. */
  readonly onReject: (version: CatalogueVersion) => void;
}
