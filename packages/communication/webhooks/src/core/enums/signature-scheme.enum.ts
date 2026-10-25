/**
 * Stackra file contract:
 * Purpose: `SignatureScheme`, how a webhook is signed: the code an Integration's `webhooks.scheme` names and that
 *          `registerWebhookEvents` accepts. Standard Webhooks is the one scheme: HMAC-SHA256 over
 *          `<webhook-id>.<webhook-timestamp>.<body>`, as Svix (and so Resend) signs.
 * Boundary: an `Enum.of` value plus the type of the same name. A provider with another scheme (Stripe, GitHub) needs a
 *           new code and its verifier here before an Integration may name it.
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
});

/** One of the codes above. */
export type SignatureScheme = Enum.Value<typeof SignatureScheme>;
