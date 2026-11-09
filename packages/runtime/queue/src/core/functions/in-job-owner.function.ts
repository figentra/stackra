/**
 * Stackra file contract:
 * Purpose: `inJobOwner`, how a cross-owner caller of the job store runs the work of one claimed job (its load, its
 *          outcome, a job it queues after it) in that job's owning scope: `inRowOwner` of @stackra/actions, bound to
 *          the worker's system actor and this package's `JobRowIsolationMissingError`.
 * Boundary: isomorphic; no logic of its own, so the owner rule lives once in @stackra/actions. With no isolation bound
 *           a platform job runs as it is, and an owned job is refused (`JobRowIsolationMissingError`, whose code stays
 *           `job_row_isolation_missing`), never skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0323.
 */
import { inRowOwner } from "@stackra/actions";
import type { CallIsolation } from "@stackra/actions/contracts";
import type { PublicId } from "@stackra/contracts";

import { JobRowIsolationMissingError } from "#core/errors/job-row-isolation-missing.error";

/**
 * Runs `work` as the queue worker in the owner `ownerId` of the claimed job `id` (the platform's when undefined).
 *
 * @example
 * const job = await inJobOwner(isolation, claim.ownerId, claim.id, () => driver.load(claim.id));
 * @throws JobRowIsolationMissingError when the job has an owner and no isolation is bound.
 */
export function inJobOwner<T>(
  isolation: CallIsolation | undefined,
  ownerId: PublicId<"scp"> | undefined,
  id: string,
  work: () => Promise<T>,
): Promise<T> {
  return inRowOwner(isolation, "sys_queue_worker", ownerId, id, work, (details) =>
    JobRowIsolationMissingError.create(details),
  );
}
