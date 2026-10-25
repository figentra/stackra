/**
 * Stackra file contract:
 * Purpose: `IamGrantedScopesDriver`, IAM's driver of `@stackra/scope`'s `GrantedScopes` port: the scope nodes a
 *          principal holds an unexpired grant at, which the scope resolver chain checks `X-Scope-Path` against.
 * Boundary: reads the principal's policy snapshot only; a principal with no grant gets an empty list, which lets it
 *           enter nothing (never everything). Each node appears once, in grant order. The principal is the one a
 *           delegate acts for, as the port states.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7); ADR 0208 (decisions 1 and 2: grants inherit downward and expire).
 */
import { Driver } from "@stackra/container";
import { type Actor, Clock, type ScopeRef } from "@stackra/contracts";
import { GrantedScopes } from "@stackra/scope/contracts";

import { PolicySource } from "#contracts/index";

/**
 * Lists where a principal holds grants.
 *
 * @example
 * await new IamGrantedScopesDriver(source, clock).of(actor); // [{ id: "scp_…", path: "platform.acme" }]
 */
export class IamGrantedScopesDriver extends Driver(GrantedScopes) {
  /** Where snapshots come from. */
  private readonly source: PolicySource;

  /** The time grants expire against. */
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

  /** The nodes `actor` (or the principal it acts for) holds an unexpired grant at. */
  async of(actor: Actor): Promise<readonly ScopeRef[]> {
    const now = this.clock.now().getTime();
    const { grants } = await this.source.snapshot(actor.onBehalfOf ?? actor);
    const scopes = new Map<string, ScopeRef>();
    for (const { scope, expiresAt } of grants)
      if (expiresAt === undefined || expiresAt.getTime() > now)
        scopes.set(scope.id, { id: scope.id, path: scope.path });
    return [...scopes.values()];
  }
}
