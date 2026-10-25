/**
 * Stackra file contract:
 * Purpose: `IntegrationWebhooks`, an Integration's `webhooks` option: how every inbound webhook of the provider is
 *          verified and routed, declared once, so each `WebhookEvent<I>({ type })` class names only its event type.
 * Boundary: a type only; `@stackra/webhooks` verifies and routes from it, and imports this package, never the reverse,
 *           so `scheme` is typed as the code of its `SignatureScheme`. The secret is a `{field}` placeholder: on a
 *           connection's URL it resolves on the connection only, on the platform's URL on the Integration only. A
 *           secret that a connection's `subscribe()` returns is written into the field this placeholder names.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 to 17); ADR 0224 (webhooks).
 */

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
}
