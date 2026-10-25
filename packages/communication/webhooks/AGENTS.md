# AGENTS — @stackra/webhooks

Standard Webhooks signing and verification, the inbound receiver of `WebhookEvent<I>`, and outbound delivery of
`webhook: true` integration events as a queue job with a delivery log (ADR 0224, ADR 0308 rules 15 to 17). Member at
`packages/communication/webhooks` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./node`, `./testing`.

## Where code goes

| You are writing…                            | It goes in…                                                         |
| ------------------------------------------- | ------------------------------------------------------------------- |
| The sender port or a type it uses           | `src/contracts/{ports,types}/`                                      |
| A scheme, a signer, a verifier, a registry  | `src/core/{enums,functions,constants}/`                             |
| An isomorphic driver, refusal or service    | `src/core/{drivers,errors,services}/`                               |
| A model, its service, the job, the listener | `src/node/{models,services,actions,listeners}/`                     |
| The job's input and its shipped schema      | `src/node/schemas/`, `src/node/constants/<name>-schema.constant.ts` |
| A migration                                 | `src/node/database/migrations/<NNNN>-<name>.migration.ts`           |
| A test helper                               | `src/testing/{functions,constants,types}/`                          |
| A test                                      | `__tests__/<name>.<kind>.test.ts` beside it                         |

## Entries and barrels

- `src/{core,contracts,node,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports it, `node` imports `core`, `testing` imports `core`. Nothing in `.`
  touches a database: the models, the services, the job and the listener are `./node`'s.
- `DELIVER_WEBHOOK_INPUT_SCHEMA` mirrors `DeliverWebhookInput` by hand until gen compiles this package's schemas.
- `./testing` registers its plugin when imported; `sideEffects` stays `false`.

## This package

- This package imports `@stackra/integrations` (the Integration's `webhooks` option, `ConnectionStore`,
  `resolvePlaceholders`, `InvalidSignatureError`), never the reverse: integrations types `webhooks.scheme` as the code
  string and `registerWebhookEvents` checks it against `SignatureScheme`.
- Verify before parsing: `WebhookReceiver` never reads a field of a body whose signature failed. A connection's URL
  resolves its secret on the connection only, the platform's URL on the Integration's `@Secret` field only; never add a
  fallback between the two.
- Compare signatures only through `crypto.subtle.verify` (constant time); never compare signature strings.
- Secrets are read blind from the `SecretStore` (or the loaded connection) at the moment of signing or verifying and
  kept nowhere: not in a job input, the delivery log, an event, a log line or an error (ADR 0173, ADR 0308 rule 20).
- A delivery attempt is logged in its own transaction (`WebhookDeliveryService.record`) before the refusal that makes
  the queue retry it; the job's `webhook-id` is the event id on every attempt.
- No tenant word is declared here (R-59, ADR 0323): a scope is a `ScopeRef`; the listener reads the event envelope's
  `tenantId` field only because @stackra/events names it so.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data          | Where                                   | Handling                                                                                       |
| ------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Event payload | the delivery job's input (`queue.jobs`) | the outbound event's fields; removed when the job ends, kept while dead-lettered; never logged |
| Endpoint URL  | `webhooks.webhook_endpoints.url`        | the receiver a scope registered; shown to that scope only                                      |
| Delivery log  | `webhooks.webhook_deliveries`           | ids, the wire name and the answer status only; no body, header or secret                       |
