/**
 * Stackra file contract:
 * Purpose: `JobClaim`, what a claim of the job store hands a cross-owner caller (the worker's reservation, the
 *          operator's dead-letter commands) before any tenant is known: the job's id and its owning tenant, never its
 *          input, origin or error.
 * Boundary: a type only. The caller loads the job (`QueueDriver.load`) and records its outcome in the claimed owner's
 *           isolation (ADR 0239 amendment, gap A); a claim with no owner is a platform row.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 3); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import type { PublicId } from "@stackra/contracts";

/** One claimed job. */
export interface JobClaim {
  /** The job id. */
  readonly id: PublicId<"job">;

  /** The owning tenant's scope node (`tenant_id`); absent for a platform row. */
  readonly ownerId?: PublicId<"scp">;
}
