/**
 * Stackra file contract:
 * Purpose: `claimedTenants(actor)`, the tenants an actor claims: its own `scopeId` and that of every actor it acts for
 *          (`onBehalfOf`), nearest first.
 * Boundary: reads the actor only; it checks nothing about the ids, which the caller compares or validates.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (the note of 2026-11-01); ADR 0360 (an agent acts for its human).
 */
import type { Actor } from "@stackra/contracts";

/**
 * The tenants `actor` claims, its own first.
 *
 * @example
 * claimedTenants({ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: userOfA }); // [userOfA.scopeId]
 */
export function claimedTenants(actor: Actor): readonly string[] {
  const claimed: string[] = [];
  for (let at: Actor | undefined = actor; at !== undefined; at = at.onBehalfOf)
    if (at.scopeId !== undefined) claimed.push(at.scopeId);
  return claimed;
}
