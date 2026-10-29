/**
 * Stackra file contract:
 * Purpose: the `RoleGrants` port: gives a principal one role at one scope node, once. The write half the operator
 *          bootstrap (`identity.operator.bootstrap@1`) needs; every other grant is made in the IAM service's own UI.
 * Boundary: an abstract class that is its own token. The IAM service that owns grants binds the driver and publishes
 *           the new snapshot as for any grant (ADR 0208); this package ships no store of grants. Idempotent: a role the
 *           principal already holds at that node is not written again, and the answer says which happened. Reads of
 *           held roles stay `RolesAtNode`.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 and 2: a grant is a role, a principal, a scope and an optional expiry);
 *                     ADR 0462; ADR 0263 (ports resolve by type); STA-1586.
 */
import { Port } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

import type { Grant } from "#contracts/types/grant.type";

/**
 * Writes one grant.
 *
 * @example
 * const written = await roleGrants.grant("usr_01j…", { role: SystemRole.Owner, scope: root, grantedBy: "svc_01j…" });
 */
export abstract class RoleGrants extends Port {
  /**
   * Gives `principal` the grant unless it already holds `grant.role` at `grant.scope`.
   *
   * @returns `true` when a grant was written, `false` when the principal already held the role there.
   * @throws Error when the grant store cannot be reached; nothing is written then.
   */
  abstract grant(principal: PublicId, grant: Grant): Promise<boolean>;
}
