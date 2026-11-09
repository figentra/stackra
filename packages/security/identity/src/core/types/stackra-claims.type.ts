/**
 * Stackra file contract:
 * Purpose: `StackraClaims`, the values of the Stackra claims one token carries (`IDENTITY_CLAIMS`): the user's `usr_`
 *          id and realm, the memberships, the scope the token was issued for and the permissions held there.
 * Boundary: a type only. The identity service gathers it for the provider's claims call; `claimsActionResponse` turns
 *           it into the provider's answer; `sessionUserOf` and `actorOf` read the claims back from the token.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 2 and 3); ADR 0208 (roles); STA-2558.
 */
import type { PublicId, Realm } from "@stackra/contracts";

import type { StackraMembership } from "#core/types/stackra-membership.type";

/** The Stackra claims of one token. */
export interface StackraClaims {
  /** The user's `usr_` public id. */
  readonly userId: PublicId<"usr">;

  /** The user's realm. */
  readonly realm: Realm;

  /** Every scope the user holds a role in. */
  readonly memberships: readonly StackraMembership[];

  /** The `ltree` path of the scope the token was issued for; absent before one is chosen. */
  readonly scopePath?: string;

  /** The permission names held in that scope. */
  readonly permissions: readonly string[];
}
