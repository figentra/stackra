/**
 * Stackra file contract:
 * Purpose: `StackraMembership`, one entry of the memberships claim (`IDENTITY_CLAIMS.memberships`): a scope node's `scp_`
 *          id, `ltree` path and name, and the role codes held there.
 * Boundary: a type only; part of `StackraClaims`.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 3); ADR 0208 (roles); STA-2558.
 */
import type { PublicId } from "@stackra/contracts";

/** One membership: a scope node and the roles held there. */
export interface StackraMembership {
  /** The scope node's `scp_` id. */
  readonly scopeId: PublicId<"scp">;

  /** The scope node's `ltree` path (`platform.acme.shop_eu`). */
  readonly path: string;

  /** The name to show. */
  readonly name: string;

  /** The role codes held there; at least one. */
  readonly roles: readonly [string, ...string[]];
}
