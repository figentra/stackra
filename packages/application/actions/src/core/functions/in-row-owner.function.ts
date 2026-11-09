/**
 * Stackra file contract:
 * Purpose: `inRowOwner`, how a cross-tenant caller (outbox's relays, the queue worker, the scheduler, the workflow
 *          engine, privacy's hold registry) runs the work of one claimed row (its load, its outcome, its delete) in
 *          that row's owning scope: through the bound `CallIsolation` as the caller's system actor in the claimed
 *          owner, or as the platform for a platform row (no owner), so row-level security shows the work that row and
 *          nothing of another tenant's.
 * Boundary: isomorphic, over the `CallIsolation` port alone; each caller names its own system actor id. Inside a
 *           running platform transaction the isolation nests (a savepoint whose tenant is put back after), so one
 *           caller reaches many tenants in turn. With no isolation bound a platform row runs as it is (no tenant set:
 *           the platform's rows), and an owned row is refused (`RowIsolationMissingError`, or the caller's own prefixed
 *           refusal), never skipped. No tenant word is declared here (ADR 0323): the owner is the `scp_` id of the
 *           tenant's node, as `Actor.scopeId` names it.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0323.
 */
import { ActorKind } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";

import type { CallIsolation } from "#contracts/ports/call-isolation.port";
import { RowIsolationMissingError } from "#core/errors/row-isolation-missing.error";

/**
 * Runs `work` as the system actor `actorId` in the owner `ownerId` of the claimed row `id` (the platform's when
 * undefined).
 *
 * @param missing - the refusal for an owned row with no isolation bound; `RowIsolationMissingError` by default.
 * @example
 * const message = await inRowOwner(isolation, "sys_outbox_relay", claim.ownerId, claim.id, () =>
 *   driver.load(claim.id),
 * );
 * @throws RowIsolationMissingError (or `missing`'s refusal) when the row has an owner and no isolation is bound.
 */
export function inRowOwner<T>(
  isolation: CallIsolation | undefined,
  actorId: PublicId<"sys">,
  ownerId: PublicId<"scp"> | undefined,
  id: string,
  work: () => Promise<T>,
  missing: (details: { readonly id: string }) => Error = (details) =>
    RowIsolationMissingError.create(details),
): Promise<T> {
  if (isolation !== undefined) {
    const actor: Actor = Object.freeze({
      kind: ActorKind.System,
      id: actorId,
      ...(ownerId === undefined ? {} : { scopeId: ownerId }),
    });
    return isolation.run(actor, undefined, () => work(), { readOnly: false });
  }
  if (ownerId !== undefined) return Promise.reject(missing({ id }));
  return work();
}
