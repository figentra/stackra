/**
 * Stackra file contract:
 * Purpose: `IntegrationWebhooks`, an Integration's `webhooks` option: how every inbound webhook of the provider is
 *          verified and routed, declared once, so each `WebhookEvent<I>({ type })` class names only its event type.
 * Boundary: a type only; `@stackra/webhooks` verifies and routes from it, and imports this package, never the reverse,
 *           so `scheme` is typed as the code of its `SignatureScheme`. The secret is a `{field}` placeholder: on a
 *           connection's URL it resolves on the connection only, on the platform's URL on the Integration only. A
 *           secret that a connection's `subscribe()` returns is written into the field this placeholder names. A
 *           scheme whose recipe is data (`hmac`) reads `signature`; the event id is the `webhook-id` header, else the
 *           payload's `eventId` path. A scheme that is not an HMAC over the raw body (`body_token`, `aes_gcm_body`,
 *           `ordered_field_hmac`, `keyed_field_digest`, `shared_header`, `jwt_hs256`) reads `recipe`.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 to 17); ADR 0224 (webhooks); STA-1357 (the regional gateways' schemes).
 */
import type { WebhookSchemeRecipe } from "#core/types/webhook-scheme-recipe.type";
import type { WebhookSignature } from "#core/types/webhook-signature.type";

/**
 * Webhook verification and routing.
 *
 * @example
 * webhooks: { scheme: SignatureScheme.StandardWebhooks, secret: "{webhookSecret}", eventType: { path: "type" } }
 */
export interface IntegrationWebhooks {
  /** The signature scheme, a `SignatureScheme` code of `@stackra/webhooks` (`standard_webhooks`). */
  readonly scheme: string;

  /** The signing secret's placeholder (`"{webhookSecret}"`). */
  readonly secret: string;

  /** Where the provider's event type sits in the payload, as a dotted path (`type`, `event.name`). */
  readonly eventType: { readonly path: string };

  /** Where the provider's event id sits in the payload, for a scheme with no id header (`id`). */
  readonly eventId?: { readonly path: string };

  /** The HMAC recipe of a scheme that reads it from data (`hmac`). */
  readonly signature?: WebhookSignature;

  /** The data of a scheme that is not an HMAC over the raw body (where the token sits, the signed fields, the hash). */
  readonly recipe?: WebhookSchemeRecipe;
}
