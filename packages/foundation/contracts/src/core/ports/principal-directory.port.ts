/**
 * Stackra file contract:
 * Purpose: the PrincipalDirectory port: answers "the supervisor of this person" inside one scope, so an escalation
 *          rule names a role in the organisation ("their supervisor") instead of a fixed principal id.
 * Boundary: an abstract class that is its own token; the driver is OS identity's (it owns the reporting lines), a
 *           fake goes with the testing helpers. Ids only: the caller resolves an address with `IdentityResolver` at
 *           the moment of sending. The scope is the authenticated caller's, never request input; a person with no
 *           supervisor in that scope (the top of the tree, or not a member there) is `null`, never an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0206 (identity is provider-neutral), ADR 0134 (personal
 *                     data is resolved, not copied), ADR 0327 (ScopeRef); STA-1237 (OS notifications gap 11).
 */
import { Port } from "#core/bases/port.base";
import type { PublicId } from "#core/types/public-id.type";
import type { ScopeRef } from "#core/types/scope-ref.type";

/**
 * Answers who a principal reports to.
 *
 * @example
 * const supervisor = await directory.supervisorOf(principalId, scope);
 * if (supervisor) await notifier.send(supervisor, escalation);
 */
export abstract class PrincipalDirectory extends Port {
  /**
   * The principal `principalId` reports to in `scope`, read at the moment of use.
   *
   * @returns the supervisor's id, or `null` when the principal has none in that scope.
   */
  abstract supervisorOf(
    principalId: PublicId<"usr">,
    scope: ScopeRef,
  ): Promise<PublicId<"usr"> | null>;
}
