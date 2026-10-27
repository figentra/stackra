/**
 * Stackra file contract:
 * Purpose: `CHATWOOT_WEBHOOK_SIGNATURE`, the recipe of Chatwoot's inbound webhook signature
 *          (`x-chatwoot-signature: sha256=<hex>`, HMAC-SHA256 of `<x-chatwoot-timestamp>.<body>` with the webhook's
 *          secret), for the OS integrations Chatwoot Integration's `webhooks.signature` under the `hmac` scheme.
 * Boundary: data only (configuration, not code): `verifyHmacWebhook` checks it, so Chatwoot gets no verifier of its
 *           own. The secret is the connection's, read blind at verify time. The five-minute window is the replay
 *           bound every timed recipe here uses. Written from Chatwoot's published scheme; certification against a live
 *           instance is pending (D3).
 * Runtime: isomorphic
 * Governing contract: ADR 0448 (decision 3); ADR 0308 (rule 15); STA-805; OS-204, OS-206.
 */
import type { WebhookSignature } from "@stackra/integrations";

/**
 * Chatwoot's webhook signature.
 *
 * @example
 * webhooks: { scheme: "hmac", secret: "{webhookSecret}", eventType: { path: "event" }, signature: CHATWOOT_WEBHOOK_SIGNATURE }
 */
export const CHATWOOT_WEBHOOK_SIGNATURE: WebhookSignature = {
  header: "x-chatwoot-signature",
  parts: { separator: ",", assign: "=", signature: "sha256" },
  timestampHeader: "x-chatwoot-timestamp",
  algorithm: "SHA-256",
  encoding: "hex",
  payload: "{timestamp}.{body}",
  tolerance: "5m",
};
