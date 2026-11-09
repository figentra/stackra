/**
 * Stackra file contract:
 * Purpose: `inRowOwner`, how the engine runs the journal work of one run or claimed signal (its load, its save, its
 *          removal) in that row's owning tenant: through the bound `CallIsolation` as the workflow runner's system
 *          actor in the owner, or as the platform for a platform row (no owner), so row-level security shows the work
 *          that row and nothing of another tenant's.
 * Boundary: isomorphic, over the `CallIsolation` port alone; @stackra/outbox's function of the same name, with this
 *           package's actor. Called inside the journal's transaction, so the isolation is a savepoint whose tenant is
 *           put back after it. With no isolation bound a platform row runs as it is, and an owned row is refused
 *           (`RowIsolationMissingError`), never skipped. No tenant word is declared here (ADR 0323): the owner is the
 *           `scp_` id of the tenant's node, as `Actor.scopeId` names it.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0323.
 */
import type { CallIsolation } from "@stackra/actions/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";
import { RowIsolationMissingError } from "@stackra/outbox";

/** The actor a row's journal work runs as: the workflow runner, in the row's owner when it has one. */
function rowActor(ownerId: PublicId<"scp"> | undefined): Actor {
  return Object.freeze({
    kind: ActorKind.System,
    id: "sys_workflow_runner",
    ...(ownerId === undefined ? {} : { scopeId: ownerId }),
  });
}

/**
 * Runs `work` in the owner `ownerId` of the row `id` (the platform's when undefined).
 *
 * @example
 * const run = await inRowOwner(isolation, claim.ownerId, claim.id, () => journal.find(claim.id));
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
