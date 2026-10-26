/**
 * Stackra file contract:
 * Purpose: `PolicySnapshotEvent`, the payload and envelope facts `PolicySnapshotIntakeService.handle` takes from the
 *          IAM service's snapshot event: the principal, the snapshot as JSON and the tenant from the event's
 *          metadata.
 * Boundary: a type only; everything in it is untrusted until the intake checks it. The event class itself belongs to
 *           the IAM service that publishes it (ADR 0141); a consumer's listener hands its payload and `meta.tenantId`
 *           here.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4); ADR 0141; STA-815.
 */
import type { PublicId } from "@stackra/contracts";

/** One snapshot event, as a consumer received it. */
export interface PolicySnapshotEvent {
  /** The principal's public id, from the payload. */
  readonly principal: unknown;

  /** The snapshot JSON, from the payload. */
  readonly snapshot: unknown;

  /** The tenant from the event's metadata; absent for a platform principal. */
  readonly tenantId?: PublicId;
}
