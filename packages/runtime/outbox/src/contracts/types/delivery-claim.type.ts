/**
 * Stackra file contract:
 * Purpose: `DeliveryClaim`, what a claim of the cross-app deliveries hands a cross-tenant caller (the cross-app relay,
 *          the operator's commands) before any tenant is known: the delivery's id, its owning tenant, its subscriber and
 *          its state, never its envelope.
 * Boundary: a type only. The caller loads the delivery (`DeliveryDriver.load`) and records its outcome in the claimed
 *           tenant's isolation (ADR 0239 amendment, gap A); a claim with no tenant is a platform row.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 13); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import type { PublicId } from "@stackra/contracts";

import type { DeliveryState } from "#contracts/enums/delivery-state.enum";

/** One claimed delivery. */
export interface DeliveryClaim {
  /** The delivery id. */
  readonly id: PublicId<"dlv">;

  /** The owning tenant's scope node (`tenant_id`); absent for a platform row. */
  readonly ownerId?: PublicId<"scp">;

  /** The consumer's member key. */
  readonly subscriber: string;

  /** Where it stands. */
  readonly state: DeliveryState;
}
