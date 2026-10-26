/**
 * Stackra file contract:
 * Purpose: `STRIPE_WEBHOOKS`, how Stripe signs its webhooks, as Integration data: the `stripe-signature` header
 *          (`t=<unix seconds>,v1=<hex>`, one `v1` per active endpoint secret), HMAC-SHA256 with the endpoint's whole
 *          `whsec_…` secret as UTF-8 key bytes over `<t>.<raw body>`, five minutes either way; events are routed by
 *          `type` and deduplicated by `id`.
 * Boundary: data only, read by `@stackra/webhooks` under its `hmac` scheme (the code is written as text because this
 *           package does not import `@stackra/webhooks`). The secret is the connection's `{webhookSecret}` on a
 *           connection's URL and the Integration's on the platform's URL. Shared by `StripeIntegration` and
 *           `StripeConnectIntegration`, which Stripe signs the same way.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); Stripe's published webhook signature scheme; spec task T014.
 */
import type { IntegrationWebhooks } from "@stackra/integrations";

/** Stripe's webhook verification and routing. */
export const STRIPE_WEBHOOKS = {
  scheme: "hmac",
  secret: "{webhookSecret}",
  eventType: { path: "type" },
  eventId: { path: "id" },
  signature: {
    header: "stripe-signature",
    parts: { separator: ",", assign: "=", signature: "v1", timestamp: "t" },
    algorithm: "SHA-256",
    encoding: "hex",
    payload: "{timestamp}.{body}",
    tolerance: "5m",
  },
} as const satisfies IntegrationWebhooks;
