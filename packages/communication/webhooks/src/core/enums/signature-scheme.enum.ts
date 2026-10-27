/**
 * Stackra file contract:
 * Purpose: `SignatureScheme`, how a webhook is signed: the code an Integration's `webhooks.scheme` names and that
 *          `registerWebhookEvents` accepts. Standard Webhooks is HMAC-SHA256 over
 *          `<webhook-id>.<webhook-timestamp>.<body>`, as Svix (and so Resend) signs; `hmac` is any HMAC whose recipe
 *          (header, layout, hash, encoding, signed text, tolerance) is the Integration's `webhooks.signature` data.
 *          The six regional gateway schemes (STA-1357) are not an HMAC over the raw body; each reads its data from
 *          the Integration's `webhooks.recipe` and is certification pending (owner decision D3).
 * Boundary: an `Enum.of` value plus the type of the same name. A provider whose signature is an HMAC over the body
 *           (Stripe, Checkout.com, GitHub) declares a recipe under `hmac`; only a scheme that is not an HMAC over the
 *           raw body and headers needs a new code and its verifier here.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 2); ADR 0308 (rule 15); the Standard Webhooks specification; ADR 0231
 *                     (snake_case codes); STA-1357.
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
  /** A token the merchant sets, echoed at a body path (`recipe.path`), compared to the secret (Moyasar). */
  BodyToken: "body_token",
  /** A hex body encrypted AES-GCM with the hex secret, IV and tag in headers (`recipe.ivHeader`, `tagHeader`; HyperPay). */
  AesGcmBody: "aes_gcm_body",
  /** A hex HMAC over the joined values of ordered body fields (`recipe.fields`, `algorithm`; Paymob). */
  OrderedFieldHmac: "ordered_field_hmac",
  /** A hex digest of ordered body fields followed by the secret (`recipe.fields`, `algorithm`; Fawry). */
  KeyedFieldDigest: "keyed_field_digest",
  /** A header whose value is the secret the merchant registered (`recipe.header`; Tabby). */
  SharedHeader: "shared_header",
  /** A JWT signed HS256 with the secret, in a query parameter or a `Bearer` header (`recipe.query`, `header`; Tamara). */
  JwtHs256: "jwt_hs256",
});

/** One of the codes above. */
export type SignatureScheme = Enum.Value<typeof SignatureScheme>;
