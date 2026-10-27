/**
 * Stackra file contract:
 * Purpose: `SessionUser`, the signed-in user as every flow reports it: the provider-neutral user id, the address and
 *          name to show, the permissions for presentation and the memberships the tenant switcher lists.
 * Boundary: a type only, the one shape the `SessionStore` port returns, the BFF's session endpoint answers and the
 *           session claims map to (ADR 0206 decision 2: provider-neutral ids and claims). Each membership is
 *           `@stackra/tenancy`'s `TenantMembership`, so the word stays tenancy's (ADR 0323); its id is the scope node's
 *           `scp_` id and its path the node's path (ADR 0327). The permissions decide what a screen shows only; the
 *           producer's pipeline still checks every call.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 2); ADR 0208 (roles and permission names); ADR 0327 (scope on the session);
 *                     ADR 0294 (decision 15).
 */
import type { Email, PublicId, Url } from "@stackra/contracts";
import type { TenantMembership } from "@stackra/tenancy/react";

/**
 * The signed-in user.
 *
 * @example
 * const user: SessionUser = {
 *   userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
 *   email: "rana@acme.example",
 *   displayName: "Rana",
 *   permissions: ["orders.order.read"],
 *   memberships: [
 *     { tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4", path: "platform.acme", name: "Acme", role: "admin", roles: ["admin"] },
 *   ],
 * };
 */
export interface SessionUser {
  /** The user's public id, minted by the identity service; never the provider's own subject id. */
  readonly userId: PublicId<"usr">;

  /** The address the provider holds for the user. */
  readonly email: Email;

  /** The name a header or an avatar shows. */
  readonly displayName: string;

  /** The picture the provider holds, when there is one. */
  readonly avatarUrl?: Url;

  /** The permissions the user holds in the active scope (`orders.order.read`), for presentation only. */
  readonly permissions: readonly string[];

  /** Every membership, in the provider's order; the tenant switcher takes them as they are. */
  readonly memberships: readonly TenantMembership[];
}
