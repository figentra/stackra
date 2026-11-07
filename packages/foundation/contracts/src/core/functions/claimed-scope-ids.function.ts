/**
 * Stackra file contract:
 * Purpose: `claimedScopeIds(actor)`, the tenants an actor claims: its own `scopeId` and that of every actor it acts for
 *          (`onBehalfOf`), nearest first.
 * Boundary: reads the actor only; it checks nothing about the ids, which the caller compares or validates.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (the note of 2026-11-01); ADR 0360 (an agent acts for its human).
 */
import type { Actor } from "#core/types/actor.type";
import type { PublicId } from "#core/types/public-id.type";

/**
 * The tenants `actor` claims, its own first.
 *
 * @example
 * claimedScopeIds({ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: userOfA }); // [userOfA.scopeId]
 */
export function claimedScopeIds(actor: Actor): readonly PublicId[] {
  const claimed: PublicId[] = [];
  for (let at: Actor | undefined = actor; at !== undefined; at = at.onBehalfOf)
    if (at.scopeId !== undefined) claimed.push(at.scopeId);
  return claimed;
}
