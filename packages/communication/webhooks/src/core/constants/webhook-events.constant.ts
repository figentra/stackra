/**
 * Stackra file contract:
 * Purpose: `WEBHOOK_EVENTS`, the inbound routing table: per Integration its `webhooks` option, its connection class and
 *          its event classes by the provider's event type; per event class its registration row.
 * Boundary: process-wide and internal: written by `registerWebhookEvents` (gen's entry), read by `WebhookReceiver` and
 *           by `deliverWebhook` in `./testing`.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 and 16); ADR 0294 (decision 25: registries written by gen).
 */
import type { WebhookEventClass } from "@stackra/events";
import type { ConnectionClass, IntegrationClass, IntegrationWebhooks } from "@stackra/integrations";

import type { WebhookEventRegistration } from "#core/types/webhook-event-registration.type";

/** One Integration's inbound routing. */
interface WebhookRoute {
  /** How its webhooks are verified and routed. */
  readonly webhooks: IntegrationWebhooks;

  /** Its connection class, whose instances hold a connection URL's secret. */
  readonly connection?: ConnectionClass;

  /** Its event classes by provider event type (`email.received`). */
  readonly types: Map<string, WebhookEventClass<object>>;
}

/** The registered webhook events. */
export const WEBHOOK_EVENTS = Object.freeze({
  /** Integration class to its routing. */
  byIntegration: new Map<IntegrationClass, WebhookRoute>(),

  /** Event class to its registration row. */
  byEvent: new Map<WebhookEventClass<object>, WebhookEventRegistration>(),
});
