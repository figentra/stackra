/**
 * Stackra file contract:
 * Purpose: `TenantMembership`, one tenant a signed-in user belongs to, as the switcher lists it: the tenant id, its
 *          scope path, its display name and the user's roles in it.
 * Boundary: a type only, declared here so `TenantSwitcher` (`.`) can hold it and exported from `./react` alone, where
 *           the template imports it (one symbol, one entry, ADR 0294 d15). The identity package fills it from the
 *           session's claims; roles are read, never computed (ADR 0208). The id and the path are the tenant's scope
 *           node, so a switch sets the active scope that `X-Scope-Path` carries.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (memberships and roles); ADR 0327 (decisions 7 and 8); ADR 0210 (decision 3: one
 *                     tenant per request).
 */
import type { PublicId } from "@stackra/contracts";

/**
 * A membership.
 *
 * @example
 * const membership: TenantMembership = {
 *   tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3",
 *   path: "platform.acme.shop_eu",
 *   name: "Acme EU",
 *   role: "admin",
 *   roles: ["admin", "staff"],
 * };
 */
export interface TenantMembership {
  /** The tenant id: the public id of the tenant's scope node. */
  readonly tenantId: PublicId<"scp">;

  /** The tenant node's `ltree` path, which the active scope sends as `X-Scope-Path`. */
  readonly path: string;

  /** The tenant's display name. */
  readonly name: string;

  /** The user's main role code in the tenant, the one a compact view shows; the first of `roles`. */
  readonly role: string;

  /** Every role code the user holds in the tenant, `role` first. */
  readonly roles: readonly string[];
}
