/**
 * Stackra file contract:
 * Purpose: the `RolesAtNode` port: the roles a principal holds at one scope node at a moment, counting every grant held
 *          at that node or above it, for a consumer that checks a role rather than a permission (an approval chain's
 *          role approver or escalation role).
 * Boundary: an abstract class that is its own token. `IamRolesAtNodeDriver` answers it from the principal's policy
 *           snapshot, so a consumer never lists another service's grants itself. An expired grant counts for nothing;
 *           a principal with no grant there gets an empty set, never every role. The principal is the one a delegate
 *           acts for, as for `GrantedScopes`.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 and 2: grants inherit downward and expire); ADR 0327 (decision 7); ADR
 *                     0263 (ports resolve by type); OS tasks-approvals SPEC gap (STA-1271).
 */
import { Port } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";

/**
 * Answers the roles held at a node.
 *
 * @example
 * const roles = await rolesAtNode.of(approver, { id: "scp_…", path: "platform.acme.riyadh" });
 * roles.has("branch_manager");
 */
export abstract class RolesAtNode extends Port {
  /**
   * The role keys `principal` holds at `scope` or above it, live at `at` (now when absent).
   *
   * @throws Error when the policy cannot be read; the caller then refuses, never as allowed.
   */
  abstract of(principal: Actor, scope: ScopeRef, at?: Date): Promise<ReadonlySet<string>>;
}
