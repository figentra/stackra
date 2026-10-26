/**
 * Stackra file contract:
 * Purpose: `CHECKOUT_WEBHOOKS`, how Checkout.com signs its webhooks, as Integration data: the `cko-signature` header
 *          holds the hex HMAC-SHA256 of the raw body, keyed with the webhook's secret key as UTF-8 bytes; there is no
 *          timestamp, so a replay is caught by the event `id` the inbox deduplicates on; events are routed by `type`.
 * Boundary: data only, read by `@stackra/webhooks` under its `hmac` scheme (the code is written as text because this
 *           package does not import `@stackra/webhooks`). Shared by the live and sandbox Integrations.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); Checkout.com's published webhook signature; spec task T014.
 */
import type { IntegrationWebhooks } from "@stackra/integrations";

/** Checkout.com's webhook verification and routing. */
export const CHECKOUT_WEBHOOKS = {
  scheme: "hmac",
  secret: "{webhookSecret}",
  eventType: { path: "type" },
  eventId: { path: "id" },
  signature: {
    header: "cko-signature",
    algorithm: "SHA-256",
    encoding: "hex",
    payload: "{body}",
  },
} as const satisfies IntegrationWebhooks;
