# Feature Specification: cross-app event relay: integration events reach other apps' inboxes from the producer's outbox

**Feature Branch**: `figentra/sta-1910-cross-app-event-relay`

**Created**: 2026-11-02

**Status**: Planned — Approved by owner 2026-11-02

**Tier**: big

**Approver**: owner

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1910

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

## Clarifications

### Session 2026-11-02

Leader (for the owner's brief):

- Q1 (sender identity) → a minimal, sufficient service identity in this spec, not a separate one. Each producer
  service signs with its own key, referenced from the secret store and never in code. The inbox verifies the signature
  against the producer's published contract and key reference, and sets `producer` from the verified signer. The spec
  says what the full STA-1792 later replaces.
- The inbox endpoint → a raw HTTP entry per consumer service that gen emits, in this spec's gen area (the contract and
  event checks, and the inbox generation). It sits beside STA-1947's one optional `loader` field in gen's `generate()`
  options, which this work merges around and never reshapes.
- Q2 (how a producer learns its subscribers) → A, with one seam. The producer's runway configuration lists, per
  environment, each consumer's inbox origin and the events it takes, and the relay reads it only through one
  `SubscriberSource` interface, so the Control Plane (draft OS ADR 0078: projects, environments, installations) can
  supply subscribers later without touching the relay. Gen warns when a consumer has a listener on a contract-only
  producer's event that no producer configuration lists, so a forgotten subscription shows at gen time instead of as a
  silent non-delivery.
- Q3 ("in dev" for the done check) → A for Done: both apps run on a testbed box with the relay between them. B, the
  deployed dev environment, is the owner's follow-up.

Builder choices, recorded for review:

- Asymmetric keys (Ed25519 through Web Crypto): the producer holds the private key; its public key and key id go into
  its own `stackra.manifest.json`, so the contract the consumer already pins carries it, signed into the registry by
  the producer's trusted publisher (ADR 0511 decision 5). The consumer holds no secret, and a key the consumer did not
  pin cannot verify.
- Rotation: the manifest lists the current and the next public key; the producer signs with the current one and moves
  to the next after consumers bump the contract. A request names its key id.
- The signature covers the delivery id, the signing time and the exact body, in the Standard Webhooks layout that
  `@stackra/webhooks` already verifies, with an Ed25519 signature instead of HMAC and the same five-minute window.

**Input**: Leader brief 2026-11-02 (owner unheld the relay): build ADR 0511 decisions 11 to 15. d11 the cross-app
envelope (`envelopeVersion`, and `producer` from the sender's verified identity, never from the envelope, STA-1792);
d12 HTTP push from the producer's outbox, one signed request per subscribed consumer inbox, retried, the signing key
from the secret store by reference only; d13 an idempotent inbox that records the event id in the same transaction as
the handling; d14 Encore Pub/Sub stays inside one app; d15 gen lifts `client_event_remote_transport` and generates the
consumer's inbox subscription from the contract. Done: billing's gen passes with its listeners on payments' events
unchanged, and an event published in pay reaches billing's inbox once in dev.

## Impact

- **Apps touched**: none
- **Services touched**: none in core. Consumers and producers in other repositories adopt it by configuration and a
  regenerate: figentra/pay (payments, producer), figentra/billing (billing and usage, consumers), figentra/os
  (scheduling-calendar, consumer), and later commerce, jute, mezzora and velora (follow-ups in those repositories)
- **Packages touched**: `packages/runtime/outbox` (the cross-app publisher, per-consumer delivery, the inbox endpoint,
  the envelope's two fields), `packages/developer/gen` (lift `client_event_remote_transport`, emit the inbox
  subscription and the inbox endpoint), `packages/developer/runway` (the relay's per-environment configuration and its
  secret names), `packages/communication/webhooks` (its signing functions reused, or moved lower if the tier rules
  require it), `packages/foundation/contracts` (the manifest type gains the producer's public keys)
- **Public contract change**: additive. The envelope gains `envelopeVersion` and `producer` on the cross-app path;
  in-app envelopes are unchanged. Every service that consumes a contract-only producer's events gains one inbox
  endpoint
- **Cross-service events**: every integration event of a contract-only producer that a consumer in another app listens
  to. First pair: `payments.payment.captured.v1` and `payments.payment.failed.v1` (figentra/pay) to billing's and
  usage's listeners (figentra/billing), and to scheduling-calendar's (figentra/os)
- **Tenancy and data**: no tenant-owned tables. One relay table on the producer for per-consumer delivery state, and
  the existing `outbox.inbox` on the consumer (event id and received-at only). The tenant and scope travel in the
  envelope as today, and the consumer runs the handling under them
- **Security and privacy**: a new inbound HTTP endpoint on every consuming service that accepts only signed requests
  from a known producer; outbound HTTP from the producer to configured consumer origins only; signing and verification
  with a replay window; `producer` comes from the verified signature, never from the body. Event payloads carry what
  they carry today (public ids, no new PII); retention of inbox ids follows the existing prune
- **Secrets**: names only. Each producer service's private signing key, `STACKRA_EVENTS_SIGNING_KEY`, referenced from
  the secret store by name. A consumer holds no secret: it verifies with the producer's public key, which the producer
  publishes in its contract
- **ADR needed**: yes, a dated amendment note on ADR 0511 (and a line on 0141's 2026-11-01 note) recording what 0511
  leaves open: the relay's producer identity (a producer key, its public half in the contract's manifest, which
  extends decision 1's manifest, not its three-file rule), the subscriber registry (Q2) and the inbox endpoint; no new
  ADR
- **New dependencies**: none (`fetch` and Web Crypto; the webhook signing functions are already in the repository)
- **Deploy modes**: SaaS: producer and consumer in one region, over the public API origin. On-prem: the same, inside
  the customer's network. Air-gapped: works when both apps run inside the network; nothing calls out to Figentra
- **Licence tier**: free (MIT, this repository)
- **UI surfaces**: none
- **Docs to update**: the `@stackra/outbox` README and AGENTS; a runbook page for running the relay (subscribers,
  keys, dead letters, replay); AGENTS.md "Services" (the cross-app event path, ADR 0511 Consequences); the ADR 0511
  Enforcement lines move from planned to automated
- **Lane**: full
- **Change risk**: R3 (inbound and outbound HTTP between services, request signing, secrets, every cross-repo product
  depends on it)

## Glossary

- **Producer**: the service whose outbox holds the event (payments in figentra/pay).
- **Consumer**: a service in another app with a listener on that event (billing in figentra/billing).
- **Contract-only producer**: a producer that a consumer knows only through its `@figentra/<service>-contract` package,
  with no sibling folder (ADR 0511 decision 3).
- **Relay**: the producer-side worker that reads the outbox and delivers each cross-app event to each subscribed
  consumer's inbox. It is not the in-service relay of ADR 0260 decision 4.
- **Inbox**: the consumer's endpoint and its record of received event ids (`outbox.inbox`), which makes a repeated
  delivery a no-op.
- **Subscription**: the fact that a consumer listens to a producer's event: which events, and where its inbox is.

## User Scenarios & Testing

### User Story 1 - A payment captured in pay settles a billing charge (Priority: P1)

Payments in figentra/pay captures a payment and writes `payments.payment.captured.v1` to its outbox in the same
transaction. The relay delivers it to billing's inbox as one signed request. Billing's inbox checks the signature,
records the event id and runs `SettleChargeOnPaymentCapturedListener` and `CloseDunningCaseOnPaymentCapturedListener` in
one transaction, under the event's tenant and scope.

**Why this priority**: it is the first cross-repo event path, and billing's charge settlement depends on it.

**Independent Test**: two apps run with the relay configured in dev. A captured payment in pay leads to exactly one
settled charge in billing, and billing's inbox holds the event id once.

**Acceptance Scenarios**:

1. **Given** billing subscribes to `payments.payment.captured.v1`, **When** pay commits a captured payment, **Then**
   billing's listeners run once with the event's data, tenant and correlation.
2. **Given** the event reached billing, **When** the relay delivers it again (a retry after a lost answer), **Then**
   billing answers success and its listeners do not run again.

---

### User Story 2 - A consumer is offline and catches up (Priority: P1)

Billing is down while pay captures three payments. The relay keeps retrying each delivery with back-off, and every
other consumer still gets its events on time. When billing comes back, the three events arrive and are handled once
each.

**Why this priority**: delivery is at least once (ADR 0511 decision 13); losing an event or blocking every consumer
on one slow consumer is not acceptable.

**Independent Test**: stop the consumer, publish, restart it. Each event is handled exactly once, and a second
consumer's deliveries were not delayed.

**Acceptance Scenarios**:

1. **Given** a consumer answers with errors, **When** the relay retries, **Then** it waits longer between attempts and
   dead-letters the delivery after its attempt limit, where an operator can see and replay it.
2. **Given** two consumers, one failing, **When** pay publishes, **Then** the healthy consumer gets the event without
   waiting on the failing one.

---

### User Story 3 - A forged or replayed request is refused (Priority: P1)

Someone posts an event to billing's inbox without a valid signature, with a producer it does not have, or with a valid
but old signed request.

**Why this priority**: the inbox runs listeners that move money; an unsigned write is a security hole (R3).

**Independent Test**: post an unsigned, a mis-signed, a stale and a wrong-producer request to the inbox. All four are
refused, and no listener runs.

**Acceptance Scenarios**:

1. **Given** a request with no or a wrong signature, **When** it reaches the inbox, **Then** it is refused, nothing is
   recorded and no listener runs.
2. **Given** an envelope that names a `producer`, **When** the signature verifies as a different producer, **Then**
   the handled envelope carries the verified producer, never the written one.

---

### User Story 4 - A consumer author writes a listener and gen does the rest (Priority: P2)

A consumer's author writes a `Listener` on an event of a contract-only producer, as for a sibling. Gen no longer
refuses it. It generates the inbox endpoint and the consumer's subscription from the contract, with no hand-written
wiring.

**Why this priority**: ADR 0511 decision 15 lifts the refusal, and the brief's done check is "billing's gen passes
with its listeners unchanged".

**Independent Test**: gen in billing passes with its payments listeners as they are, and its output holds the inbox
endpoint and a subscription naming payments' two events.

**Acceptance Scenarios**:

1. **Given** a listener on a contract-only producer's event, **When** gen runs, **Then** it passes and emits the inbox
   and the subscription.
2. **Given** a listener on an event the producer's contract does not declare, **When** gen runs, **Then** it still
   refuses with `client_event_unknown`.

---

### User Story 5 - Events inside one app keep Encore Pub/Sub (Priority: P2)

Two services of one app keep their typed Encore subscription for each other's events; nothing about them goes over
HTTP.

**Why this priority**: ADR 0511 decision 14; the relay must not change the in-app path.

**Independent Test**: an app with sibling services generates the same `subscriptions.ts` as before, and no relay
delivery is created for a sibling consumer.

**Acceptance Scenarios**:

1. **Given** a consumer whose producer is a sibling folder, **When** gen runs, **Then** its subscription is the Encore
   one, unchanged.

---

### Edge Cases

- **EC-01**: an event version newer than the consumer reads arrives: the inbox does not handle it and answers so the
  producer's older version, published under the same id, is the one handled (the existing `receive` rule).
- **EC-02**: the inbox handles the event, but its answer is lost: the retry is acknowledged and not handled again.
- **EC-03**: the producer's signing key rotates: requests signed with the old or the new key both verify during the
  overlap.
- **EC-04**: a consumer is removed from the subscribers: its pending deliveries stop and are dropped, with a log line.
- **EC-05**: a payload breaks the event's schema: the inbox refuses it, records nothing, and the delivery goes to the
  dead letters after its attempts instead of looping.
- **EC-06**: one consumer's inbox is slow: deliveries to it time out and retry without holding up other consumers.
- **EC-07**: the producer's clock is skewed: a signature outside the replay window is refused, and the refusal says why.

## Requirements

### Functional Requirements

- **FR-001**: WHEN a producer commits an integration event that a consumer in another app subscribes to THE relay
  SHALL deliver it from the producer's outbox to that consumer's inbox, never from a request handler (d12).
- **FR-002**: THE relay SHALL send each delivery as one signed HTTP request per consumer, with the signing key read from
  the secret store by its name (d12).
- **FR-003**: IF a delivery fails or times out THEN THE relay SHALL retry it with growing back-off, independently per
  consumer, and dead-letter it after its attempt limit (d12).
- **FR-004**: THE relay SHALL send the envelope of ADR 0141 decision 2 with `envelopeVersion`, and SHALL NOT let the
  producer's own value decide `producer` (d11).
- **FR-005**: WHEN the inbox receives a request THE inbox SHALL verify the signature, the signing time inside a replay
  window, and that the signer is a producer this consumer subscribes to, before it reads the body as an event.
- **FR-006**: IF verification fails THEN THE inbox SHALL refuse the request, record nothing and run no listener.
- **FR-007**: WHEN verification passes THE inbox SHALL set `producer` to the verified producer, record the event id and
  run the consumer's listeners in one transaction, under the envelope's tenant, scope and actor (d11, d13).
- **FR-008**: WHEN an event id is already recorded THE inbox SHALL acknowledge the request and SHALL NOT run the
  listeners again (d13).
- **FR-009**: THE relay SHALL NOT be used between services of one app; a sibling consumer keeps its Encore Pub/Sub
  subscription (d14).
- **FR-010**: WHEN a consumer listens to an event of a contract-only producer THE gen SHALL pass and emit the
  consumer's inbox endpoint and its subscription to that event from the contract, instead of refusing with
  `client_event_remote_transport` (d15).
- **FR-011**: IF a listener names an event that the producer's contract does not declare THEN THE gen SHALL refuse it
  with `client_event_unknown`, as today.
- **FR-012**: THE relay SHALL deliver to a consumer only the events that consumer subscribes to, reading the
  subscribers and their inbox origins per environment only through one subscriber-source interface, whose first source
  is the producer's runway configuration.
- **FR-020**: IF a consumer listens to a contract-only producer's event that the producer's configuration does not list
  for that consumer THEN THE gen SHALL warn, naming the consumer, the producer and the event.
- **FR-013**: THE relay SHALL sign each delivery with its producer service's own private key, read from the secret
  store by name, and name the key's id on the request; no key SHALL appear in code, configuration values or the
  repository.
- **FR-014**: THE relay and the inbox SHALL expose, per consumer, the pending, failed and dead-lettered deliveries, and
  an operator SHALL be able to replay a dead-lettered delivery.
- **FR-015**: THE runway configuration SHALL name, per environment, the relay's secrets by name only, never a value.
- **FR-016**: WHEN gen builds a producer service with cross-app events THE gen SHALL write the producer's public
  verification keys and their ids into its `stackra.manifest.json`, from the producer's declared configuration, so its
  contract publishes them.
- **FR-017**: WHEN the inbox verifies a request THE inbox SHALL accept only a signature made by a key that the pinned
  contract of a producer this consumer subscribes to declares, and SHALL take `producer` from that contract.
- **FR-018**: WHEN a consumer service listens to at least one contract-only producer's event THE gen SHALL emit one
  raw HTTP inbox entry for that service, outside session authentication, that verifies the request and hands the
  envelope to the consumer's existing inbox; a service with no such listener SHALL get no inbox entry.
- **FR-019**: WHEN the producer's manifest lists a next key THE inbox SHALL accept signatures by either listed key, so
  a rotation needs no simultaneous deploy.

### Key Entities

- **Cross-app envelope**: ADR 0141's envelope plus `envelopeVersion` and `producer`.
- **Delivery**: one event bound for one consumer: its attempts, next attempt time, last error and dead-letter time.
- **Subscription**: a consumer, the producer events it listens to, and its inbox address per environment.
- **Inbox record**: a received event id and when it was received (the existing `outbox.inbox`).
- **Producer key**: a producer service's signing key pair. The private half lives in the secret store; the public half
  and its id live in the producer's manifest, so its contract carries them.

## Acceptance criteria

- **AC-001**: WHEN pay commits `payments.payment.captured.v1` in dev THE billing inbox SHALL handle it exactly once.
- **AC-002**: WHEN the same event is delivered twice THE inbox SHALL run the listeners once and acknowledge both.
- **AC-003**: IF a request is unsigned, mis-signed, outside the replay window or from an unknown producer THEN THE inbox
  SHALL refuse it and run no listener.
- **AC-004**: WHEN gen runs in figentra/billing with its payments listeners unchanged THE gen SHALL pass.
- **AC-005**: WHEN one consumer fails THE relay SHALL keep delivering to the others on time.
- **AC-006**: WHERE the producer is a sibling folder THE gen SHALL emit the Encore subscription unchanged.
- **AC-007**: THE handled envelope SHALL carry the verified `producer`, whatever the body says.
- **AC-008**: IF a request is signed by a key that the consumer's pinned contract of that producer does not list THEN
  THE inbox SHALL refuse it.
- **AC-009**: WHERE a consumer service has no listener on a contract-only producer's event THE gen SHALL emit no inbox
  entry for it.

## Success Criteria

- **SC-001**: an event published in pay reaches billing's inbox and is handled exactly once in dev, with both apps
  running on a testbed box and the relay between them — verified by: e2e (box run, cited on the PR). The same check in
  the deployed dev environment is the owner's follow-up
- **SC-002**: 100% of unsigned, mis-signed, stale and wrong-producer requests are refused, and none runs a listener —
  verified by: unit (inbox verification table)
- **SC-003**: with 1,000 deliveries replayed after a consumer outage, each event is handled once and none is lost —
  verified by: unit (driver against the memory and Postgres drivers)
- **SC-004**: gen in figentra/billing and figentra/os scheduling-calendar passes with their listeners unchanged —
  verified by: manual (box run, output recorded on the PR)
- **SC-005**: a failing consumer adds no delay to another consumer's deliveries beyond one poll interval — verified by:
  unit
- **SC-006**: sibling services' generated subscriptions are byte-identical before and after — verified by: unit (gen
  snapshot)

## Out of scope

- A broker driver (Kafka, NATS, Redpanda): deferred by ADR 0227; needs its own ADR (ADR 0511 decision 12).
- STA-1792's general service identity. This spec's producer key is the minimal identity the relay needs. STA-1792
  later replaces it: a platform-issued, short-lived workload identity per service (verified by the inbox and by every
  cross-service call, not only events), so the long-lived key in the secret store and the public key in the manifest
  retire, and `producer` comes from that identity. The inbox's verification step is the seam: STA-1792 swaps its
  verifier, not the relay or the inbox record.
- Deploying the relay to dev, staging or production: the owner starts deploys.
- The producer and consumer configuration in figentra/pay, billing and os, beyond the dev check: their own PRs.
- Cleaning up delivered or dead-lettered rows beyond the existing prune schedule.
- Ordering guarantees between events: delivery is at least once and unordered, as inside one app.

## Assumptions

- The consumer side builds on `@stackra/outbox`'s existing inbox (`InboxService.receive` claims the event id in the
  handling transaction), so decision 13 adds an HTTP entry point, not a new store.
- The producer reaches the consumer over the consumer's public API origin through the generated gateway (ADR 0237); the
  inbox is a raw endpoint that skips session auth because the signature authenticates it.
- A consumer trusts a producer's public key because it arrives in the contract the consumer pins through its catalog,
  and only the producer's own repository can publish that contract (ADR 0511 decision 5).
- Retry defaults follow the outbox's own: exponential back-off, ten attempts, then dead letter.
- In-app (sibling) events are untouched; only contract-only producers' events take the relay.

## Amendments

None.

## Status history

- 2026-11-02 · — → Draft · Claude (STA-1910 session) · created
- 2026-11-02 · Draft → Clarified · Claude (STA-1910 session) · leader answered Q1 to Q3
- 2026-11-02 · Clarified → Planned · Claude (STA-1910 session) · plan written; waits for the owner's approval (big
  tier, R3) before tasks — Approved by owner 2026-11-02 (relayed by the leader, about 06:15Z)
