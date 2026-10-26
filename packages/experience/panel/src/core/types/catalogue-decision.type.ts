/**
 * Stackra file contract:
 * Purpose: `CatalogueDecision`, what one viewer may do with one plan-catalogue version in the admin: approve it,
 *          reject it, and whether it is their own proposal.
 * Boundary: a type only; `catalogueDecisionOf` builds it. The service enforces the same rules; this only decides which
 *           buttons the console offers.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 4); owner OS-381 (second approver).
 */

/** The viewer's choices on one version. */
export interface CatalogueDecision {
  /** True for a pending version someone else proposed. */
  readonly canApprove: boolean;
  /** True for any pending version; the proposer rejecting it withdraws it. */
  readonly canReject: boolean;
  /** True when the viewer proposed it. */
  readonly isOwn: boolean;
}
