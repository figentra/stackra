/**
 * Stackra file contract:
 * Purpose: `DeliverableEventRow`, one row of the webhook event catalogue a registry feeds to the webhooks service at
 *          manifest publish: the wire name, the payload shape, the kept fields of a thin payload, and a withdrawal.
 * Boundary: a type only; the same fields as the webhooks `deliverable_event.register` input, so a row is sent as is.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (webhooks); ADR 0134; OS-210, OS-212.
 */
import type { DeliverablePayload } from "#core/enums/deliverable-payload.enum";

/** One deliverable event, upserted by wire name. */
export type DeliverableEventRow = {
  /** The wire name (`orders.order.paid.v1`). */
  readonly type: string;
  /** Thin when the event carries a personal-data class, otherwise full. */
  readonly payload: DeliverablePayload;
  /** For a thin payload, the non-id fields kept; `[]` keeps ids only. */
  readonly thinFields?: readonly string[];
  /** True when the new release no longer offers the event to webhooks. */
  readonly withdrawn?: true;
};
