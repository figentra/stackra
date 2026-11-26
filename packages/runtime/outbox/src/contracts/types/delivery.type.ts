/**
 * Stackra file contract:
 * Purpose: `Delivery`, one cross-app delivery as a `DeliveryDriver` keeps it: one event version for one subscriber,
 *          the envelope as sent, and its delivery state.
 * Boundary: a type only. (event id, subscriber, type) is unique, so a relay retry and an older version under the same
 *           id stay single and distinct. The envelope never carries `producer`.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 13, amendment of 2026-11-02); ADR 0078 (decision 4).
 */
import type { PublicId } from "@stackra/contracts";

import type { CrossAppEnvelope } from "#contracts/types/cross-app-envelope.type";
import type { DeliveryError } from "#contracts/types/delivery-error.type";

/** A stored cross-app delivery. */
export interface Delivery {
  /** The delivery id; the `webhook-id` header. */
  readonly id: PublicId<"dlv">;

  /** The event id (`evt_…`), the envelope's `id`. */
  readonly eventId: string;

  /** The consumer's member key. */
  readonly subscriber: string;

  /** The versioned wire name. */
  readonly type: string;

  /** The envelope as it is sent, without `producer`. */
  readonly envelope: CrossAppEnvelope;

  /** Attempts so far. */
  readonly attempts: number;

  /** When it is next due. */
  readonly availableAt: Date;

  /** How its last attempt failed. */
  readonly lastError?: DeliveryError;

  /** When it was dead-lettered; the relay skips it from then on. */
  readonly deadAt?: Date;

  /** When it was written. */
  readonly createdAt: Date;
}
