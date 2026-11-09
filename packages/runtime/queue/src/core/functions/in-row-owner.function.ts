/**
 * Stackra file contract:
 * Purpose: `inRowOwner`, how a cross-owner caller of the job store runs the work of one claimed job (its load, its
 *          outcome, a job it queues after it) in that job's owning scope: through the bound `CallIsolation` as the
 *          worker's system actor in the claimed owner, or as the platform for a platform job (no owner), so row-level
 *          security shows the work that job and nothing of another owner's.
 * Boundary: isomorphic, over the `CallIsolation` port alone (outbox's helper, mirrored: outbox depends on this package).
 *           Inside a running platform transaction the isolation nests (a savepoint whose owner is put back after). With
 *           no isolation bound a platform job runs as it is, and an owned job is refused
 *           (`JobRowIsolationMissingError`), never skipped. No tenant word is declared here (ADR 0323): the owner is
 *           the `scp_` id of the tenant's node, as `Actor.scopeId` names it.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0323.
 */
import type { CallIsolation } from "@stackra/actions/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";

import { JobRowIsolationMissingError } from "#core/errors/job-row-isolation-missing.error";

/** The actor a claimed job's row work runs as: the worker's system actor, in the job's owner when it has one. */
function rowActor(ownerId: PublicId<"scp"> | undefined): Actor {
  return Object.freeze({
    kind: ActorKind.System,
    id: "sys_queue_worker",
    ...(ownerId === undefined ? {} : { scopeId: ownerId }),
  });
}

/**
 * Runs `work` in the owner `ownerId` of the claimed job `id` (the platform's when undefined).
 *
 * @example
 * const job = await inRowOwner(isolation, claim.ownerId, claim.id, () => driver.load(claim.id));
 * @throws JobRowIsolationMissingError when the job has an owner and no isolation is bound.
 */
export function inRowOwner<T>(
  isolation: CallIsolation | undefined,
  ownerId: PublicId<"scp"> | undefined,
  id: string,
  work: () => Promise<T>,
): Promise<T> {
  if (isolation !== undefined)
    return isolation.run(rowActor(ownerId), undefined, () => work(), { readOnly: false });
  if (ownerId !== undefined) return Promise.reject(JobRowIsolationMissingError.create({ id }));
  return work();
}
