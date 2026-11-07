/**
 * Stackra file contract:
 * Purpose: `actingTenant(actor)`, the tenant a call runs as: an agent's own `scopeId` or, with none, the tenant of the
 *          human it acts for; any other actor's own `scopeId`. `undefined` is a platform call.
 * Boundary: reads the actor only. `CallIsolationDriver` checks the scope against this tenant and
 *           `TenantIsolationService` sets `app.tenant_id` to it, so the two never disagree.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (the note of 2026-11-01); ADR 0360 (an agent acts within its human's tenant); ADR 0239.
 */
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";

import { claimedTenants } from "#core/functions/claimed-tenants.function";

/**
 * The tenant `actor` acts in, or `undefined` for a platform call.
 *
 * @example
 * actingTenant({ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: userOfA }); // userOfA.scopeId
 */
export function actingTenant(actor: Actor): string | undefined {
  return actor.kind === ActorKind.Agent ? claimedTenants(actor)[0] : actor.scopeId;
}
