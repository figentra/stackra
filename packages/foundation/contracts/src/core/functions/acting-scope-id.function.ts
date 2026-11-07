/**
 * Stackra file contract:
 * Purpose: `actingScopeId(actor)`, the tenant a call runs as: an agent's own `scopeId` or, with none, the tenant of the
 *          human it acts for; any other actor's own `scopeId`. `undefined` is a platform call.
 * Boundary: reads the actor only. It is the one answer to "which tenant does this call act in" for an actor:
 *           the pipeline's `CallDescriptor.scopeId`, the tenancy package's isolation and scope check, the queue's job
 *           actor and the audit and access-log writers all read it, so none disagrees with another.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (the note of 2026-11-01); ADR 0360 (an agent acts within its human's tenant); ADR 0239.
 */
import { ActorKind } from "#core/enums/actor-kind.enum";
import { claimedScopeIds } from "#core/functions/claimed-scope-ids.function";
import type { Actor } from "#core/types/actor.type";
import type { PublicId } from "#core/types/public-id.type";

/**
 * The tenant `actor` acts in, or `undefined` for a platform call.
 *
 * @example
 * actingScopeId({ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: userOfA }); // userOfA.scopeId
 */
export function actingScopeId(actor: Actor): PublicId | undefined {
  return actor.kind === ActorKind.Agent ? claimedScopeIds(actor)[0] : actor.scopeId;
}
