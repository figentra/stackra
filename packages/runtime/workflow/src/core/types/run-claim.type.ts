/**
 * Stackra file contract:
 * Purpose: `RunClaim`, what the worker's tick claims before any tenant is known (`WorkflowJournal.due`): a due run's
 *          id, its owning tenant and its start, never its input, steps or origin.
 * Boundary: a type only. The engine loads the run (`WorkflowJournal.find`) and advances it in the claimed tenant's
 *           isolation (ADR 0239 amendment, gap A); a claim with no owner is a platform run.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decision 1); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import type { PublicId } from "@stackra/contracts";

/** One claimed due run. */
export interface RunClaim {
  /** The run's id. */
  readonly id: PublicId<"wfr">;

  /** The owning tenant's scope node (`tenant_id`); absent for a platform run. */
  readonly ownerId?: PublicId<"scp">;

  /** When the run started: the tick's order. */
  readonly startedAt: Date;
}
