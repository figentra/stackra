# Feature Specification: `@stackra/webhooks` wave 6, Standard Webhooks in and out

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/webhooks` (communication, wave 6): Standard Webhooks sign and verify (ADR 0224 decision 2),
outbound delivery as a queue job with retries, a delivery log and secret references only (ADR 0224 decision 3, ADR
0173), and inbound webhooks routed through the `WebhookEvent<Integration>({ type })` kind of @stackra/events with the
verification its Integration declares (ADR 0308 rules 15 to 17). The template imports `SignatureScheme` from `.` and
`deliverWebhook` from `./testing`.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's notifications and commerce services adopt it once converted, STA-344)
- **Packages touched**: `packages/communication/webhooks` (new member); `packages/foundation/events` (one type widened:
  `ListenerClass` takes a constructor with dependencies, so a listener with constructor parameters can be registered)
- **Cross-service events**: none; outbound webhooks carry the producer's integration events under their wire names
- **Tenancy and data**: two tables in the package's own schema, `webhooks.webhook_endpoints` and
  `webhooks.webhook_deliveries`, keyed by `scope_id` and `scope_path`, with no row-level-security policy: the fan-out
  listener reads the endpoints of an event's scope node outside any scope session, and the delivery job opens the
  endpoint's scope as its session; every read names its scope node (an open item for the owner's data review); no
  tenant vocabulary is declared (R-59, ADR 0323)
- **Secrets**: none held. Endpoints store secret names; the job reads values blind from the `SecretStore`; inbound
  secrets are the Integration's `@Secret` fields and the connection's secret fields
- **ADR needed**: no (ADR 0224 and ADR 0308 decide the behaviour; ADR 0142, 0148, 0173, 0294, 0305 and 0328 bind it);
  the gaps are listed under Open items
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); Web Crypto only
- **Deploy modes**: same code in all; the `http` sender on every mode
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/communication/webhooks/README.md`, `packages/communication/webhooks/AGENTS.md`; ADR 0224 and ADR 0308 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (a new public contract on a trust boundary: inbound verification and outbound signing)

## Clarifications

### Session 2026-10-25

The package follows ADR 0224, ADR 0308, the v3.1 registry row and the owner decisions of 2026-10-24. The choices
recorded when it was specified:

- Registry row: `.` exports `SignatureScheme`, `./testing` exports `deliverWebhook`; `./contracts` (the `WebhookSender`
  port) and `./node` (the models, the job, the listener) exist because each has a file (ADR 0127 note); one symbol, one
  entry (ADR 0294 d15)
- Kind-base ownership (registry §3): `WebhookEvent` is @stackra/events', `Integration` and `Connection` are
  @stackra/integrations'; this package declares no kind base and reuses them
- Dependency direction: this package imports @stackra/integrations (its `webhooks` option, `ConnectionStore`,
  `resolvePlaceholders`, `InvalidSignatureError`, which the template's test expects), so integrations cannot import
  `SignatureScheme` without a package cycle; integrations keeps `webhooks.scheme` as the code string and
  `registerWebhookEvents` checks it against `SignatureScheme`
- Template contract: `SignatureScheme.StandardWebhooks` in `ResendIntegration.webhooks`; `deliverWebhook(Event,
payload, { secret, connectionId? })` resolves `{ ok: true }` or a result that `toRefuseWith(refusal(
InvalidSignatureError))` matches, and `drainOutbox()` then runs the listeners
- Standard Webhooks: HMAC-SHA256 of `<id>.<timestamp>.<body>`, `v1,<base64>` signatures, a five-minute tolerance, a
  `whsec_<base64>` secret or any other string as UTF-8; Svix's `svix-*` header names are read too (Resend signs
  through Svix); ed25519 (`v1a`) is not built
- No fallback between a connection's secret and the platform's (ADR 0308 rule 16 and the template's safeguard)
- Outbound: the body is fixed when the job is queued; the `webhook-id` is the event id on every attempt; about three
  days of exponential retries (ADR 0224 d3), then the dead-letter queue, and a dead letter disables the endpoint
  (ADR 0224 d3: "a subscription that keeps failing is disabled automatically")
- Rotation (ADR 0308 rule 17): an outbound endpoint keeps the replaced secret signing for 24 hours
- Owner, 2026-10-24: data gate lifted, so the models and migrations build now; the model review happens on the
  data-wave PR

## User Scenarios & Testing

### User Story 1 - Verify an inbound provider webhook (Priority: P1)

Resend posts `email.received` to the platform's URL or to a tenant connection's URL; the receiver verifies it against
the matching secret before parsing it and writes `InboundMailReceived` to the outbox.

**Independent Test**: `src/core/services/__tests__/webhook-receiver.service.test.ts`,
`src/core/functions/__tests__/verify-webhook.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a body signed with the platform secret, **When** it is posted to the platform's URL, **Then** the event is
   written with the `webhook-id` as its id.
2. **Given** a body signed with the platform secret, **When** it is posted to a connection's URL, **Then** it is
   refused with `invalid_signature` and nothing is written.

### User Story 2 - Test an inbound webhook (Priority: P1)

A service test calls `deliverWebhook(InboundMailReceived, payload, { secret })` and asserts the refusal or drains the
outbox.

**Independent Test**: `src/testing/functions/__tests__/deliver-webhook.function.test.ts`.

### User Story 3 - Deliver outbound webhooks (Priority: P1)

`OrderPaid` (`webhook: true`) is published; each enabled endpoint of its scope subscribed to `orders.order.paid.v1`
receives one signed delivery, retried until it answers 2xx.

**Independent Test**: `src/node/listeners/__tests__/send-webhooks.listener.test.ts`,
`src/node/actions/__tests__/deliver-webhook.action.test.ts`.

### User Story 4 - Rotate and disable an endpoint (Priority: P2)

An endpoint's secret is rotated and both secrets sign for 24 hours; an endpoint whose delivery dead-letters stops.

**Independent Test**: `src/node/models/__tests__/webhook-endpoint.model.test.ts`,
`src/node/services/__tests__/webhook-endpoint.service.test.ts`.

### Edge Cases

- A stale or future timestamp beyond five minutes: refused.
- An event type no class handles: acknowledged and dropped.
- A connection URL of a platform-only Integration, or an unknown connection: `not_found`.
- An endpoint removed or disabled after its job was queued: the attempt is skipped.
- A signing secret with no value in the store: the attempt fails before posting and is retried.
- A redirect answer: a failed attempt (redirects are never followed).

## Requirements

- **FR-001**: The package SHALL be `@stackra/webhooks` at `packages/communication/webhooks`, `tier:lib`, entries `.`,
  `./contracts`, `./node` and `./testing` only.
- **FR-002**: It SHALL export `SignatureScheme` from `.` and `deliverWebhook` from `./testing` with the template's call
  shapes.
- **FR-003**: `signWebhook` and `verifyWebhook` SHALL implement Standard Webhooks (HMAC-SHA256, the three headers, a
  five-minute tolerance, one signature per secret) and pass the specification's test vector.
- **FR-004**: `WebhookReceiver.receive` SHALL verify before parsing, against the connection's secret on a connection's
  URL and the Integration's `@Secret` field on the platform's URL with no fallback, route by the Integration's event
  type path to the registered class, and write the event to the `EventOutbox` keyed by the `webhook-id` with the
  connection in its metadata.
- **FR-005**: `registerWebhookEvents` SHALL refuse a row whose classes are of the wrong kind, whose Integration has no
  `webhooks` or a scheme outside `SignatureScheme`, or that adds a second connection class or a second class for one
  event type.
- **FR-006**: Outbound delivery SHALL queue one `DeliverWebhookAction` job per enabled subscribed endpoint of the
  event's scope, sign each attempt with the endpoint's secrets read blind by name, log every attempt in its own
  transaction, refuse a non-2xx answer as retryable for about three days, and disable the endpoint on a dead letter.
- **FR-007**: An endpoint SHALL store secret names only, register https URLs only, and sign with the replaced secret
  for 24 hours after a rotation.
- **FR-008**: No identifier in the package SHALL declare tenant vocabulary, and no secret value SHALL be stored,
  logged or put in a job, an event or an error.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; no typecheck
  runs here (owner instruction, 2026-10-24).

## Open items (for the owner, not blocking)

- Data review: both tables carry no row-level-security policy (the fan-out reads across scope sessions); every read
  names its scope node. An endpoint receives the events of its own scope node only; subtree delivery is not built.
- The template's inbound test drains the outbox the events harness holds; `deliverWebhook` writes to the app's bound
  `EventOutbox`, so the testing app must bind the `OutboxFake` (gen's testing wiring or `.override`).
- Inbound rotation (two provider secrets for 24 hours) needs a previous-secret field on the connection
  (@stackra/integrations); the receiver already verifies against a list.
- Gen needs: `registerWebhookEvents` rows from each `WebhookEvent<I>` heritage clause with the Integration's connection
  class, `registerOutboundWebhooks` rows with the locked wire names, the inbound route
  (`/webhooks/<module>/<name>/:connectionId`, raw body) calling `WebhookReceiver.receive`, and the `WebhookSender`
  driver binding (`http`).
- Not built: ed25519 (`v1a`) signatures, the thin personal-data mode, FIFO delivery, the endpoint console and portal
  (replay is the queue's redrive), raw payload retention for 30 days (the gateway's, ADR 0224 d4), Convoy, and a
  private-network egress check on endpoint URLs (the runtime's egress policy).
- Outbound wire names are kept here until @stackra/outbox's event-name registry is settled; one registry later.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
