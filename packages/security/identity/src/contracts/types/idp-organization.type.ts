/**
 * Stackra file contract:
 * Purpose: `IdpOrganization`, what `IdpOrganizations.organizationOf` answers: the identity provider organisation's id
 *          and the one scope node it belongs to (the tenant's root node), so a caller can check that the call's scope
 *          is that node and not a descendant before it touches a policy that covers the whole tenant.
 * Boundary: a type only. `scopeId` is the node the host linked the organisation to, never a node the lookup walked
 *           to; the caller compares it with the session's scope.
 * Runtime: isomorphic
 * Governing contract: ADR 0410 (decision 4); ADR 0294 (subtree grants); ADR 0462; ADR 0323; STA-2817.
 */
import type { PublicId } from "@stackra/contracts";

/** A scope's identity provider organisation and the scope node it belongs to. */
export interface IdpOrganization {
  /** The provider-side id of the organisation. */
  readonly organizationId: string;

  /** The scope node the organisation belongs to: the tenant's root node, never a descendant. */
  readonly scopeId: PublicId<"scp">;
}
