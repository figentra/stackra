/**
 * Stackra file contract:
 * Purpose: `OutboxClaim`, what a claim of the outbox hands a cross-tenant caller (the relay, the prune) before any
 *          tenant is known: the message's id, its owning tenant and when it is due, never its payload.
 * Boundary: a type only. The caller loads the message (`OutboxDriver.load`) and records its outcome in the claimed
 *           tenant's isolation (ADR 0239 amendment, gap A); a claim with no tenant is a platform row.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import type { PublicId } from "@stackra/contracts";

/** One claimed message. */
export interface OutboxClaim {
  /** The message id. */
  readonly id: PublicId<"evt">;

  /** The owning tenant's scope node (`tenant_id`); absent for a platform row. */
  readonly ownerId?: PublicId<"scp">;

  /** When it is due. */
  readonly availableAt: Date;
}
