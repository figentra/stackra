/**
 * Stackra file contract:
 * Purpose: `OUTBOUND_EVENTS`, the integration events that may leave as outbound webhooks, each with its wire name (the
 *          `type` of the delivered body and what an endpoint subscribes to).
 * Boundary: process-wide and internal: written by `registerOutboundWebhooks` (gen's entry, with the locked wire names),
 *           read by `SendWebhooksListener`.
 * Runtime: node
 * Governing contract: ADR 0224 (decision 1: only public, versioned integration events); ADR 0141 (wire names).
 */
import type { EventClass } from "@stackra/events";

/** Event class to its wire name (`orders.order.paid.v1`). */
export const OUTBOUND_EVENTS = new Map<EventClass, string>();
