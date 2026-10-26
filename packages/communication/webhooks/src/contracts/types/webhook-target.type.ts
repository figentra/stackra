/**
 * Stackra file contract:
 * Purpose: `WebhookTarget`, one receiver of outbound webhooks as the delivery machinery sees it, whatever table holds
 *          it: its id, its scope node and its URL (https, or an `s3://bucket/prefix` target).
 * Boundary: a type only, in the leaf entry. It carries no secret; `WebhookDeliveryTarget` adds the signing secrets for
 *           the one attempt that reads them.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decisions 1 and 3); ADR 0327 (decision 3: keyed by scope); ADR 0422 (decision 4).
 */
import type { ScopeRef } from "@stackra/contracts";

/** A receiver a fan-out queues a delivery for. */
export interface WebhookTarget {
  /** The receiver's id in its store (`whe_…` for this package's `WebhookEndpoint`). */
  readonly id: string;

  /** The scope node the delivery job runs in. */
  readonly scope: ScopeRef;

  /** The receiver's https URL or `s3://bucket/prefix?region=…` target. */
  readonly url: string;
}
