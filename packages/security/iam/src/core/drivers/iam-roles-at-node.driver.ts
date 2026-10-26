/**
 * Stackra file contract:
 * Purpose: `IamRolesAtNodeDriver`, IAM's driver of the `RolesAtNode` port: the roles of a principal's grants that are
 *          unexpired at the moment asked and held at the node or above it.
 * Boundary: reads the principal's policy snapshot only; a principal with no grant there gets an empty set. The
 *           principal is the one a delegate acts for. A node covers itself and its descendants (`isWithinScope` of
 *           @stackra/scope), the rule the decision point applies to grants.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 and 2); ADR 0327 (decision 7); STA-1271.
 */
import { Driver } from "@stackra/container";
import { type Actor, Clock, type ScopeRef } from "@stackra/contracts";
import { isWithinScope } from "@stackra/scope";

import { PolicySource, RolesAtNode } from "#contracts/index";

/**
 * Lists the roles a principal holds at a node.
 *
 * @example
 * await new IamRolesAtNodeDriver(source, clock).of(actor, branch); // Set {"branch_manager"}
 */
export class IamRolesAtNodeDriver extends Driver(RolesAtNode) {
  /** Where snapshots come from. */
  private readonly source: PolicySource;

  /** The time grants expire against when no moment is given. */
  private readonly clock: Clock;

  /**
   * @param source - the principal's policy snapshot.
   * @param clock - the current time.
   */
  constructor(source: PolicySource, clock: Clock) {
    super();
    this.source = source;
    this.clock = clock;
  }

  /** See `RolesAtNode.of`. */
  async of(principal: Actor, scope: ScopeRef, at?: Date): Promise<ReadonlySet<string>> {
    const time = (at ?? this.clock.now()).getTime();
    const { grants } = await this.source.snapshot(principal.onBehalfOf ?? principal);
    const roles = new Set<string>();
    for (const grant of grants)
      if (
        (grant.expiresAt === undefined || grant.expiresAt.getTime() > time) &&
        isWithinScope(scope.path, grant.scope.path)
      )
        roles.add(grant.role);
    return roles;
  }
}
