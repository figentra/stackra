# @stackra/webhooks

<!--
Stackra file contract:
Purpose: the package's reader guide: signing, verification (Standard Webhooks, `hmac` recipes and the six regional
         gateway schemes), the inbound receiver, provider recipes and outbound delivery.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0224; ADR 0308 (rules 15 to 17); ADR 0448; STA-1357.
-->

Stackra webhooks: Standard Webhooks signing and verification, the inbound receiver that verifies a provider webhook
against the secret its Integration names and routes it to its `WebhookEvent<I>` class, and outbound delivery of
`webhook: true` integration events to the endpoints a scope registers (ADR 0224, ADR 0308 rules 15 to 17).

**Tier:** `tier:lib` (`packages/communication/webhooks`). Entries `.`, `./contracts`, `./node` and `./testing`. Depends
on `@stackra/actions`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`,
`@stackra/errors`, `@stackra/events`, `@stackra/integrations`, `@stackra/model`, `@stackra/queue`,
`@stackra/validation` and zod.

## What is here

| Symbol                                                             | Entry         | Use                                                                                            |
| ------------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------- |
| `SignatureScheme`                                                  | `.`           | an Integration's `webhooks.scheme`: one of the eight codes under "Signature schemes"           |
| `signWebhook`, `WebhookMessage`, `WebhookHeaders`                  | `.`           | the `webhook-id`, `webhook-timestamp` and `webhook-signature` headers of a message             |
| `verifyWebhook`                                                    | `.`           | whether a received webhook is signed by one of the secrets, within five minutes                |
| `verifyHmacWebhook`                                                | `.`           | the `hmac` scheme: checks a provider's data recipe (`WebhookSignature`)                        |
| `verifyBodyToken`, `decryptAesGcmBody`, `verifyOrderedFieldHmac`   | `.`           | the `body_token`, `aes_gcm_body` and `ordered_field_hmac` schemes (`webhooks.recipe`)          |
| `verifyKeyedFieldDigest`, `verifySharedHeader`, `verifyJwtHs256`   | `.`           | the `keyed_field_digest`, `shared_header` and `jwt_hs256` schemes (`webhooks.recipe`)          |
| `CHATWOOT_WEBHOOK_SIGNATURE`                                       | `.`           | Chatwoot's recipe: `sha256=<hex>` of `<x-chatwoot-timestamp>.<body>`, five minutes (ADR 0448)  |
| `registerWebhookEvents`, `WebhookEventRegistration`                | `.`           | gen's entry routes each `WebhookEvent<I>` class by its Integration and event type              |
| `WebhookReceiver`, `InboundWebhook`                                | `.`           | verifies, routes and writes one inbound webhook to the outbox; the generated route calls it    |
| `attemptWebhook`, `webhookBody`                                    | `.`           | one signed delivery attempt (https post or S3 object) and the `{ type, timestamp, data }` body |
| `HttpWebhookSenderDriver`                                          | `.`           | the `http` `WebhookSender`: one `POST` with `fetch`, no redirect followed                      |
| `WebhookDeliveryFailedError`                                       | `.`           | `webhook_delivery_failed` (retryable): the endpoint did not answer 2xx                         |
| `WebhookSender`, `WebhookRequest`                                  | `./contracts` | the port an outbound transport implements                                                      |
| `WebhookEndpointStore`, `WebhookDeliveryLog`                       | `./contracts` | where the job and the fan-out find receivers and log attempts; a host binds its own tables     |
| `WebhookEndpoint`, `WebhookEndpointService`                        | `./node`      | a scope's receiver: `register`, `subscribedTo`, `rotate`, `disable`                            |
| `WebhookDelivery`, `WebhookDeliveryService`                        | `./node`      | the delivery log, one row per attempt                                                          |
| `ModelWebhookEndpointStoreDriver`, `ModelWebhookDeliveryLogDriver` | `./node`      | the default store and log over the two tables above                                            |
| `DeliverWebhookAction`, `DeliverWebhookInput`                      | `./node`      | the delivery job: sign, post, log; retried for about three days                                |
| `SendWebhooksListener`, `registerOutboundWebhooks`                 | `./node`      | the fan-out of each `webhook: true` event to the subscribed endpoints                          |
| `deliverWebhook`, `WebhookResult`                                  | `./testing`   | sign a provider payload with a test secret and deliver it to the testing app                   |

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
- Chatwoot (OS-204, OS-206; ADR 0448): the OS integrations Chatwoot Integration declares
  `webhooks: { scheme: SignatureScheme.Hmac, secret: "{webhookSecret}", eventType: { path: "event" }, signature:
CHATWOOT_WEBHOOK_SIGNATURE }`; the recipe is data, so Chatwoot has no verifier of its own.
- Gen's entry calls `registerWebhookEvents([{ event, integration, connection }])`; the scheme must be a
  `SignatureScheme` code, and the fields its scheme reads (`signature`, or the `recipe` fields below) must be there.

### Signature schemes

`SignatureScheme` is exactly these eight codes. A provider whose signature is an HMAC over the raw body and headers is
`hmac` data; the six regional gateway schemes (STA-1357) are not, so each has a code and a verifier, and reads its data
from the Integration's `webhooks.recipe` (`WebhookSchemeRecipe`, `@stackra/integrations`). Every comparison is constant
time (`crypto.subtle.verify`, or `sameBytes`, which MACs both sides under a one-call random key).

| Code                 | Gateway (public docs) | Verifies                                                                            | `recipe` fields                              |
| -------------------- | --------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------- |
| `standard_webhooks`  | Resend (Svix)         | HMAC-SHA256 over `<id>.<timestamp>.<body>`, five minutes                            | none                                         |
| `hmac`               | Stripe, Checkout.com  | an HMAC over the body as `webhooks.signature` describes                             | none (`signature`)                           |
| `body_token`         | Moyasar               | a token at a body path (or header, query) equals the secret                         | `path`, `header` or `query`                  |
| `aes_gcm_body`       | HyperPay              | the hex body decrypts AES-GCM under the hex key; the receiver parses the plaintext  | `ivHeader`, `tagHeader`                      |
| `ordered_field_hmac` | Paymob                | a hex HMAC over ordered body field values joined with nothing                       | `fields`, `algorithm`, and a carrier         |
| `keyed_field_digest` | Fawry                 | a hex hash of ordered body field values followed by the secret                      | `fields`, `algorithm`, `decimals`, a carrier |
| `shared_header`      | Tabby                 | a registered header equals the secret (weaker: the Connection re-reads the payment) | `header`                                     |
| `jwt_hs256`          | Tamara                | a JWT signed HS256, `alg` must be `HS256`, `exp` and `nbf` hold                     | `query` and/or `header` (`Bearer`)           |

The six regional schemes are built from each vendor's public documentation with fixture tests made in-test; they are
**certification pending** (owner decision D3) until checked against each gateway's sandbox. The vendor recipes (field
lists, header names) are OS integrations data (ADR 0443 decision 7), never constants here. For those schemes the event
id is the payload's `eventId` path and the event occurred when it was received.

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
- An endpoint stores secret names, never values. `register` accepts an https URL or an S3 target; blocking private
  hosts is the runtime's egress policy.

### Your own tables

The job and the fan-out read receivers through `WebhookEndpointStore` and log through `WebhookDeliveryLog`. The `model`
drivers answer from `webhooks.webhook_endpoints` and `webhooks.webhook_deliveries`. A service that keeps its own
endpoint and attempt tables (encrypted secret columns, thin payloads, its own module keys) binds its own drivers with
`@Replaces` and keeps `SendWebhooksListener`, `DeliverWebhookAction`, the retries and the dead-letter disable:

```ts
export class EndpointWebhookEndpointStoreDriver extends Driver(WebhookEndpointStore) {
  async subscribedTo(scopeId: string, type: string): Promise<readonly WebhookTarget[]> { ... }
  async target(id: string, now: Date): Promise<WebhookDeliveryTarget | null> { ... } // secrets resolved here, at the attempt
  async disable(id: string, at: Date): Promise<void> { ... }
}
```

A receiver that is not a scope's subscription, a partner's lead endpoint for one, is queued directly: the host's store
answers `target` for the partner's id, and the host pushes the job with the `webhookBody` of the lead.

```ts
await queue.push(
  DeliverWebhookAction,
  {
    endpointId: partner.id,
    eventId,
    type: "registry.lead.submitted.v1",
    body: webhookBody(type, now, lead),
  },
  { scope, idempotencyKey: `${eventId}:${partner.id}` },
);
```

A host with its own job (another retry policy) calls `attemptWebhook` for one attempt and records the outcome itself.

### S3 targets (ADR 0422)

An endpoint URL `s3://<bucket>/<prefix>?region=<region>` receives each delivery as an object at
`<prefix>/<type>/<yyyy>/<mm>/<dd>/<eventId>.json`: the same signed body, with the Standard Webhooks headers as object
metadata, so a SIEM that reads the bucket verifies it as a receiver would. `S3WebhookObjectSinkDriver` (`./node`)
writes it with the AWS SDK's default credentials (the platform's role). Managed or bring your own: the bucket is the
platform's, or the tenant's own with a bucket policy that grants that role `s3:PutObject`; no tenant credential is
stored. A refused write is logged and retried like a failed post. `WebhookObjectSinkFake` in `./testing` keeps objects
in memory.

### Entitlement-gated events

A registration row may name the entitlement a subscriber needs:
`registerOutboundWebhooks([{ type: AuditRecordAppended, name: "records.audit_record.appended.v1", entitlement:
"records.audit_evidence" }])`. `register` refuses a gated event the scope is not granted (`entitlement_required` on
`events`), and the fan-out skips it while the grant is gone, so a downgrade stops the stream at once. Grants are read
through `WebhookEntitlementSource`; a deployment binds a driver over its plan or licence, and with none every gate stays
shut.

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
