/**
 * Stackra file contract:
 * Purpose: `inRowOwner`, how a cross-tenant caller runs the work of one claimed row (its load, its outcome, its
 *          delete) in that row's owning scope: through the bound `CallIsolation` as the outbox's system actor in the
 *          claimed owner, or as the platform for a platform row (no owner), so row-level security shows the work that
 *          row and nothing of another tenant's.
 * Boundary: isomorphic, over the `CallIsolation` port alone. Inside a running platform transaction the isolation nests
 *           (a savepoint whose tenant is put back after), so one caller reaches many tenants in turn. With no isolation
 *           bound a platform row runs as it is (no tenant set: the platform's rows), and an owned row is refused
 *           (`RowIsolationMissingError`), never skipped. No tenant word is declared here (ADR 0323): the owner is the
 *           `scp_` id of the tenant's node, as `Actor.scopeId` names it.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0323.
 */
import type { CallIsolation } from "@stackra/actions/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";

import { RowIsolationMissingError } from "#core/errors/row-isolation-missing.error";

/** The actor a claimed row's work runs as: the outbox's system actor, in the row's owner when it has one. */
function rowActor(ownerId: PublicId<"scp"> | undefined): Actor {
  return Object.freeze({
    kind: ActorKind.System,
    id: "sys_outbox_relay",
    ...(ownerId === undefined ? {} : { scopeId: ownerId }),
  });
}

/**
 * Runs `work` in the owner `ownerId` of the claimed row `id` (the platform's when undefined).
 *
 * @example
 * const message = await inRowOwner(isolation, claim.ownerId, claim.id, () => driver.load(claim.id));
 * @throws RowIsolationMissingError when the row has an owner and no isolation is bound.
 */
export function inRowOwner<T>(
  isolation: CallIsolation | undefined,
  ownerId: PublicId<"scp"> | undefined,
  id: string,
  work: () => Promise<T>,
): Promise<T> {
  if (isolation !== undefined)
    return isolation.run(rowActor(ownerId), undefined, () => work(), { readOnly: false });
  if (ownerId !== undefined) return Promise.reject(RowIsolationMissingError.create({ id }));
  return work();
}
