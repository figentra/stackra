/**
 * Stackra file contract:
 * Purpose: `ownerOf`, the owner a new connection at `level` gets from the running call: the user it acts for, or the
 *          scope node it acts in.
 * Boundary: internal; both store drivers call it at connect. A call that has no owner at that level is a programming
 *           error (a platform job connecting a user's calendar), so it throws a `TypeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 9); ADR 0327 (decisions 5 and 6).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { ConnectionContext } from "#contracts/ports/connection-context.port";
import { ConnectionLevel } from "#core/enums/connection-level.enum";

/**
 * The owner of a connection at `level`.
 *
 * @throws TypeError when the call acts for no user (`User`) or in no scope (`Scope`).
 * @example
 * ownerOf(ConnectionLevel.Scope, context); // { scope: { id: "scp_...", path: "..." } }
 */
export function ownerOf(
  level: ConnectionLevel,
  context: ConnectionContext,
): { readonly scope: ScopeRef } | { readonly userId: PublicId<"usr"> } {
  if (level === ConnectionLevel.User) {
    const userId = context.user();
    if (userId === undefined)
      throw new TypeError("A user connection is added only by a call that acts for a user");
    return { userId };
  }
  const scope = context.scope();
  if (scope === undefined)
    throw new TypeError("A scope connection is added only by a call that acts in a scope");
  return { scope };
}
