/**
 * Stackra file contract:
 * Purpose: `SignatureScheme`, how a webhook is signed: the code an Integration's `webhooks.scheme` names and that
 *          `registerWebhookEvents` accepts. Standard Webhooks is HMAC-SHA256 over
 *          `<webhook-id>.<webhook-timestamp>.<body>`, as Svix (and so Resend) signs; `hmac` is any HMAC whose recipe
 *          (header, layout, hash, encoding, signed text, tolerance) is the Integration's `webhooks.signature` data.
 * Boundary: an `Enum.of` value plus the type of the same name. A provider whose signature is an HMAC over the body
 *           (Stripe, Checkout.com, GitHub) declares a recipe under `hmac`; only a scheme that is not an HMAC over the
 *           raw body and headers needs a new code and its verifier here.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 2); ADR 0308 (rule 15); the Standard Webhooks specification; ADR 0231
 *                     (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The webhook signature schemes.
 *
 * @example
 * webhooks: { scheme: SignatureScheme.StandardWebhooks, secret: "{webhookSecret}", eventType: { path: "type" } }
 */
export const SignatureScheme = Enum.of({
  /** Standard Webhooks: `webhook-id`, `webhook-timestamp` and `webhook-signature` (`v1,<base64>`), HMAC-SHA256. */
  StandardWebhooks: "standard_webhooks",
  /** An HMAC whose recipe is the Integration's `webhooks.signature` data (Stripe, Checkout.com). */
  Hmac: "hmac",
});

/** One of the codes above. */
export type SignatureScheme = Enum.Value<typeof SignatureScheme>;
