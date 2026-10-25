# @stackra/webhooks

Stackra webhooks: Standard Webhooks signing and verification, the inbound receiver that verifies a provider webhook
against the secret its Integration names and routes it to its `WebhookEvent<I>` class, and outbound delivery of
`webhook: true` integration events to the endpoints a scope registers (ADR 0224, ADR 0308 rules 15 to 17).

**Tier:** `tier:lib` (`packages/communication/webhooks`). Entries `.`, `./contracts`, `./node` and `./testing`. Depends
on `@stackra/actions`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`,
`@stackra/errors`, `@stackra/events`, `@stackra/integrations`, `@stackra/model`, `@stackra/queue`,
`@stackra/validation` and zod.

## What is here

| Symbol                                              | Entry         | Use                                                                                         |
| --------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `SignatureScheme`                                   | `.`           | an Integration's `webhooks.scheme`: `SignatureScheme.StandardWebhooks`                      |
| `signWebhook`, `WebhookMessage`, `WebhookHeaders`   | `.`           | the `webhook-id`, `webhook-timestamp` and `webhook-signature` headers of a message          |
| `verifyWebhook`                                     | `.`           | whether a received webhook is signed by one of the secrets, within five minutes             |
| `registerWebhookEvents`, `WebhookEventRegistration` | `.`           | gen's entry routes each `WebhookEvent<I>` class by its Integration and event type           |
| `WebhookReceiver`, `InboundWebhook`                 | `.`           | verifies, routes and writes one inbound webhook to the outbox; the generated route calls it |
| `HttpWebhookSenderDriver`                           | `.`           | the `http` `WebhookSender`: one `POST` with `fetch`, no redirect followed                   |
| `WebhookDeliveryFailedError`                        | `.`           | `webhook_delivery_failed` (retryable): the endpoint did not answer 2xx                      |
| `WebhookSender`, `WebhookRequest`                   | `./contracts` | the port an outbound transport implements                                                   |
| `WebhookEndpoint`, `WebhookEndpointService`         | `./node`      | a scope's receiver: `register`, `subscribedTo`, `rotate`, `disable`                         |
| `WebhookDelivery`, `WebhookDeliveryService`         | `./node`      | the delivery log, one row per attempt                                                       |
| `DeliverWebhookAction`, `DeliverWebhookInput`       | `./node`      | the delivery job: sign, post, log; retried for about three days                             |
| `SendWebhooksListener`, `registerOutboundWebhooks`  | `./node`      | the fan-out of each `webhook: true` event to the subscribed endpoints                       |
| `deliverWebhook`, `WebhookResult`                   | `./testing`   | sign a provider payload with a test secret and deliver it to the testing app                |

## Inbound: a provider webhook is a `WebhookEvent<I>`

The Integration declares verification and routing once; each event class names only the provider's event type.

```ts
import { SignatureScheme } from "@stackra/webhooks";

export class ResendIntegration extends Integration({
  provider: "resend",
  // ...
  webhooks: { scheme: SignatureScheme.StandardWebhooks, secret: "{webhookSecret}", eventType: { path: "type" } },
}) {
  @Secret("RESEND_WEBHOOK_SECRET")
  webhookSecret!: string;
}

export class InboundMailReceived extends WebhookEvent<ResendIntegration>({ type: "email.received" }) { ... }
```

- The URL is `/webhooks/<module>/<name>/:connectionId`. A connection's URL verifies only against that connection's
  secret field; the platform's own URL only against the Integration's `@Secret` field. Neither falls back to the
  other, so an event signed for one is refused at the other with `InvalidSignatureError` (`@stackra/integrations`).
- The signature is checked before any field is parsed. Svix's `svix-*` header names are read too (Resend signs through
  Svix). A secret is `whsec_<base64>` or any other string, read as UTF-8.
- A verified event is written to the `EventOutbox` with the `webhook-id` as its id (the inbox deduplicates a
  redelivery) and `connection` in its metadata, which listeners read as `ctx.connection`. An event type with no class
  is acknowledged and dropped, so the provider never retries it.
- Gen's entry calls `registerWebhookEvents([{ event, integration, connection }])`; the scheme must be a
  `SignatureScheme` code.

## Outbound: `webhook: true` integration events

```ts
export class OrderPaid extends IntegrationEvent({ name: "order.paid", webhook: true }) { ... }

// a console action of the consuming service
await endpoints.register({ scope, url: "https://hooks.acme.example/in", events: ["orders.order.paid.v1"], secretName });
```

- Gen's entry calls `registerOutboundWebhooks([{ type: OrderPaid, name: "orders.order.paid.v1" }])`, which subscribes
  `SendWebhooksListener`. For each occurrence it queues one `DeliverWebhookAction` job per enabled endpoint of the
  event's scope node subscribed to the wire name, with the body `{ type, timestamp, data }` fixed for every retry.
- Each attempt signs with the endpoint's secrets, read blind from the `SecretStore` by name, and posts through the
  `WebhookSender`. The `webhook-id` is the event id on every attempt; the timestamp is the attempt's.
- A non-2xx answer (a redirect included) or no answer is logged and refused as retryable: exponential backoff, about
  three days of retries, then the dead-letter queue (redrive with `QueueService.redrive`) and the endpoint is disabled.
- `rotate(id, secretName, at)` keeps the replaced secret signing for 24 hours, so a receiver holding either verifies.
- An endpoint stores secret names, never values. `register` accepts https URLs only; blocking private hosts is the
  runtime's egress policy.

## Testing

```ts
import { deliverWebhook } from "@stackra/webhooks/testing";

const result = await deliverWebhook(InboundMailReceived, payload, { secret: "wrong" });
expect(result).toRefuseWith(refusal(InvalidSignatureError));

await deliverWebhook(InboundMailReceived, payload, { secret: SECRET, connectionId });
await drainOutbox(); // @stackra/events: runs the listeners
```

`deliverWebhook` signs the payload with the test secret and goes through the real `WebhookReceiver` of the testing app
compiled last; the app's secret store (`.withSecrets`) and connection store (`.withConnection`) hold the secrets it is
checked against, and the app binds an `EventOutbox` (`.override(EventOutbox, new OutboxFake())` when it has none).
