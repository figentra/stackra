# Plan: `@stackra/webhooks` wave 6

**Spec**: `.agents/specs/sta-348-webhooks/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the leaf: the
  `WebhookSender` port and `WebhookRequest`), `.` from `src/core/` (the scheme, the signer and verifier, the inbound
  registration and receiver, the `http` sender, the refusal), `./node` from `src/node/` (the models, their services,
  the delivery job, the fan-out listener, the outbound registration and the migrations), `./testing` from
  `src/testing/`.
- `signWebhook` and `verifyWebhook` share `signingKey` (a `whsec_` secret is Base64, any other UTF-8) and run on Web
  Crypto, so the package is isomorphic; `crypto.subtle.verify` compares each candidate signature in constant time.
- `registerWebhookEvents` fills `WEBHOOK_EVENTS`: per Integration its `webhooks` option (read with `kindOf`), its
  connection class and its event classes by provider type; per event class its row.
- `WebhookReceiver.receive` resolves the secret placeholder with `resolvePlaceholders` on one side only (the loaded
  connection, or the Integration's `@Secret` names through the `SecretStore`), verifies, parses, reads the event type
  at the dotted path, builds the event with `create` and writes it to the `EventOutbox`.
- `registerOutboundWebhooks` records each `webhook: true` event's wire name and subscribes `SendWebhooksListener` with
  `registerListeners`; the listener queues `DeliverWebhookAction` per subscribed endpoint through `QueueService.push`
  with the endpoint's `ScopeRef` and an Idempotency-Key of event and endpoint.
- `DeliverWebhookAction` (`job: { retries: 80, backoff: exponential, deadLetter, onDeadLetter: "disableEndpoint" }`)
  signs with `WebhookEndpoint.secretNamesAt(now)`, posts through `WebhookSender`, records the attempt with
  `WebhookDeliveryService.record` (a `requiresNew` insert) and throws `WebhookDeliveryFailedError` on a non-2xx.
- The testing plugin keeps the app compiled last; `deliverWebhook` signs with the test secret and calls the app's
  receiver (or one built from the app's bindings), returning a result instead of throwing a refusal.

## Constitution Check

| Law                                   | Result | Note                                                                                                          |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/communication/webhooks`; imports only `tier:lib` packages; no app, service or Encore  |
| Secrets (ADR 0173)                    | PASS   | secret names only in tables; values read blind at the moment of signing or verifying and kept nowhere         |
| Security                              | PASS   | verify before parse, constant-time comparison, five-minute replay window, no redirect followed, https only    |
| HTTP and events                       | PASS   | no hand-written endpoint; the inbound route is gen's; refusals are typed (`webhook_delivery_failed`)          |
| Tenancy                               | PASS   | no tenant word declared; scope is a `ScopeRef`; no RLS on the two tables (spec open item for the data review) |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests        |
| Not built yet (ADR 0227)              | PASS   | no gateway product, no Kafka, no new dependency                                                               |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                     |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                             |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                     |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                            |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0224 and 0308 stand, the gaps are listed in the spec            |

- Boundaries: runtime imports of actions, config, container, contracts, database, errors, events, integrations, model,
  queue and validation; dev-only `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: services `<Name>Service`, the driver `HttpWebhookSenderDriver`, the action `DeliverWebhookAction`, the
  listener `SendWebhooksListener`, the refusal ends in `Error`, the migrations `Create…Migration`, no `define` prefix;
  `SignatureScheme` is an `Enum.of` value.

## Properties

- **P-001**: `package.json` names `@stackra/webhooks` at `packages/communication/webhooks` and `exports` lists only `.`, `./contracts`, `./node` and `./testing` — Validates: FR-001
- **P-002**: each entry's `index.test.ts` lists exactly its values, with `SignatureScheme` in `.` and `deliverWebhook` in `./testing` — Validates: FR-002
- **P-003**: the Standard Webhooks test vector signs to and verifies from its published signature; for every body, secret and timestamp, a changed body, another secret or a timestamp more than five minutes away does not verify — Validates: FR-003
- **P-004**: for every delivery, the event is written only when the signature verifies against the side its URL names; a platform-signed body to a connection's URL and the reverse are refused with nothing written — Validates: FR-004
- **P-005**: every malformed registration row throws before the routing table changes — Validates: FR-005
- **P-006**: for every sequence of endpoint answers, each attempt is logged once, a non-2xx is refused as retryable, and a dead letter disables the endpoint — Validates: FR-006
- **P-007**: a registered endpoint has an https URL and secret names only; within 24 hours of a rotation it signs with both names, after it with the current one — Validates: FR-007
- **P-008**: `grep -rE "(const|let|class|interface|type|function) [A-Za-z]*[Tt]enant" packages/communication/webhooks/src` finds nothing — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------- |
| SaaS       | the same build; endpoints and the log live in each service's own Postgres                          |
| On-prem    | identical: the same build, no SaaS-only code path                                                  |
| Air-gapped | identical: outbound delivery reaches only endpoints inside the deployment; inbound needs no egress |
