/**
 * Stackra file contract:
 * Purpose: `WebhookEventRegistration`, one row of `registerWebhookEvents`: a `WebhookEvent<I>` class, its Integration
 *          and, when the Integration has one, its connection class.
 * Boundary: a type only. The Integration is a type argument of the event class (`~integration` never exists at
 *           runtime), so gen writes it here from the heritage clause, with the connection class it registered for the
 *           same Integration; authored code never writes a row outside a test.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 15 and 16); ADR 0305 (rules 42 to 46: partner type arguments).
 */
import type { WebhookEventClass } from "@stackra/events";
import type { ConnectionClass, IntegrationClass } from "@stackra/integrations";

/** A webhook event and where its secret lives. */
export interface WebhookEventRegistration {
  /** The event class (`InboundMailReceived`). */
  readonly event: WebhookEventClass<object>;

  /** Its Integration (`ResendIntegration`), which declares `webhooks: { scheme, secret, eventType }`. */
  readonly integration: IntegrationClass;

  /** The Integration's connection class (`ResendConnection`); absent for a platform-only Integration. */
  readonly connection?: ConnectionClass;
}
