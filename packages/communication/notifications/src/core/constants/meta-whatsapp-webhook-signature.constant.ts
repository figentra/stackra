/**
 * Stackra file contract:
 * Purpose: `META_WHATSAPP_WEBHOOK_SIGNATURE`, the published recipe of Meta's webhook signature
 *          (`x-hub-signature-256: sha256=<hex>`, HMAC-SHA256 of the raw body with the app secret), for the Meta
 *          Integration's `webhooks.signature` under the `hmac` scheme.
 * Boundary: data only (configuration, not code): `@stackra/webhooks`' `verifyHmacWebhook` checks it; the app secret is
 *           the Integration's `@Secret`, read blind at verify time. Meta signs no timestamp, so no age is checked.
 * Runtime: isomorphic
 * Governing contract: ADR 0448 (decision 2); ADR 0308 (rule 15); Meta Graph API webhooks (payload validation).
 */
import type { WebhookSignature } from "@stackra/integrations";

/**
 * Meta's webhook signature.
 *
 * @example
 * webhooks: { scheme: "hmac", secret: "{appSecret}", eventType: { path: "object" }, signature: META_WHATSAPP_WEBHOOK_SIGNATURE }
 */
export const META_WHATSAPP_WEBHOOK_SIGNATURE: WebhookSignature = {
  header: "x-hub-signature-256",
  parts: { separator: ",", assign: "=", signature: "sha256" },
  algorithm: "SHA-256",
  encoding: "hex",
  payload: "{body}",
};
