/**
 * Stackra file contract:
 * Purpose: `Delivery`, one cross-app event bound for one subscriber: the envelope as sent, the subscriber's member key,
 *          and its delivery state (attempts, when it is next due, the last failure and when it was dead-lettered).
 * Boundary: a type only. A delivered row is deleted; a dead one stays until it is replayed or pruned. Ids are
 *           `dlv_` public ids; one row per event id, subscriber and wire name.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 13); ADR 0078 (decision 4).
 */
import type { PublicId } from "@stackra/contracts";

import type { CrossAppEnvelope } from "#contracts/types/cross-app-envelope.type";
import type { OutboxError } from "#contracts/types/outbox-error.type";

/** One event for one subscriber. */
export interface Delivery {
  /** The delivery id, also the signed request's id. */
  readonly id: PublicId<"dlv">;

  /** The subscriber's member key. */
  readonly subscriber: string;

  /** The envelope as it is sent. */
  readonly envelope: CrossAppEnvelope;

  /** Attempts made so far. */
  readonly attempts: number;

  /** When it is next due. */
  readonly availableAt: Date;

  /** When it was written. */
  readonly createdAt: Date;

  /** The last failure: a code and the answer's status or the error's message, never a body. */
  readonly lastError?: OutboxError;

  /** When it was dead-lettered. */
  readonly deadAt?: Date;
}
