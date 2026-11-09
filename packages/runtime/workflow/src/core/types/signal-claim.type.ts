/**
 * Stackra file contract:
 * Purpose: `SignalClaim`, what the tick's expiry claims before any tenant is known (`WorkflowJournal.expired`): a
 *          lapsed held signal's id and its owning tenant, never its payload.
 * Boundary: a type only. The engine removes the claimed signals (`WorkflowJournal.remove`) in each owner's isolation;
 *           a claim with no owner is a platform signal.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (0294 note: held signals lapse); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import type { PublicId } from "@stackra/contracts";

/** One claimed lapsed signal. */
export interface SignalClaim {
  /** The held signal's id. */
  readonly id: PublicId<"wfs">;

  /** The owning tenant's scope node (`tenant_id`); absent for a platform signal. */
  readonly ownerId?: PublicId<"scp">;
}
