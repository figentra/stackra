/**
 * Stackra file contract:
 * Purpose: `ChangeClaim`, what a claim of the change log hands a cross-tenant caller (the relay, the warehouse sink,
 *          the retention step) before any tenant is known: an entry's position and its owning tenant, never its row.
 * Boundary: a type only. The caller loads the entries (`ChangeFeed.load`) or deletes them (`ChangeFeed.remove`) in the
 *           claimed tenant's isolation (ADR 0239 amendment, gap A); a claim with no tenant is a platform row.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import type { PublicId } from "@stackra/contracts";

/** One claimed change log entry. */
export interface ChangeClaim {
  /** Where the entry sits in the log; opaque, ordered by the driver. */
  readonly position: string;

  /** The owning tenant's scope node (`tenant_id`); absent for a platform row. */
  readonly ownerId?: PublicId<"scp">;
}
