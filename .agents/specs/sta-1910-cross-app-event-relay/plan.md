# Implementation Plan: cross-app event relay

**Spec**: `.agents/specs/sta-1910-cross-app-event-relay/spec.md` · **Linear**: STA-1910 · **Date**: 2026-11-02

**Input**: Feature specification from `.agents/specs/sta-1910-cross-app-event-relay/spec.md`

## Summary

The producer's outbox relay, after it publishes an event inside its own app, also writes one delivery row per
subscribed consumer in another app (subscribers come from a `SubscriberSource`, first read from the producer's runway
configuration). A separate cross-app relay sends each delivery as one Ed25519-signed POST to the consumer's inbox,
retries per consumer, and dead-letters. The consumer's generated inbox endpoint verifies the signature against the
producer keys in the consumer's pinned contract, sets `producer` from that contract, and hands the envelope to the
existing `InboxService.receive`, which claims the event id in the handling transaction. Gen lifts
`client_event_remote_transport`, emits the inbox (controller, Encore raw adapter, the pinned producers' key table),
writes a producer's public keys and subscribers into its manifest, and warns on a listener no producer lists.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/runtime/outbox` (`tier:lib`), `packages/developer/gen` (`tier:lib`),
  `packages/developer/runway` (`tier:lib`), `packages/foundation/contracts` (`tier:lib`); signing follows
  `packages/communication/webhooks`' Standard Webhooks layout without importing it (see research R-4)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); Postgres driver tests on the testbed; gen golden fixtures in
  `packages/developer/gen/__golden__/`
- **Storage**: one migration in `@stackra/outbox`, `outbox.deliveries`; the existing `outbox.inbox` is reused
- **Runtime target**: a library (`@stackra/outbox`) and the Encore app that `stackra gen` writes for each service

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                             |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | Packages only; outbox imports contracts, never webhooks (R-4); no service imports another; the consumer learns the producer only from its contract               |
| Secrets (ADR 0009)                    | PASS   | The private key is read from the secret store by name (`STACKRA_EVENTS_SIGNING_KEY`); public keys are not secrets and live in runway config and the manifest     |
| Security                              | PASS   | Verify before parse; replay window; key must be listed in the pinned contract; `producer` from the contract, never the body; outbound only to configured origins |
| HTTP and events                       | PASS   | Events leave only from the outbox (d12); the inbox is a raw `Controller` (ADR 0294 d16); envelope per ADR 0141 plus the two cross-app fields                     |
| Tenancy                               | PASS   | No tenant table; the inbox runs handling under the envelope's scope and actor through the existing `CallIsolation` path of `InboxService`                        |
| Delegation                            | PASS   | Waves below; signing, verification and gen stay with the lead session (R3)                                                                                       |
| Not built yet (ADR 0011)              | PASS   | No broker (ADR 0227 keeps Kafka, NATS, Redpanda deferred); HTTP and Postgres only                                                                                |
| Test placement (ADR 0022)             | PASS   | Every test in `src/**/__tests__/`; goldens in gen's existing `__golden__`                                                                                        |
| Versions and catalogs                 | PASS   | No new dependency: `fetch` and Web Crypto Ed25519 (Node 24)                                                                                                      |
| Deploy modes (ADR 0076)               | PASS   | Rows below; nothing calls Figentra; air-gapped works inside the network                                                                                          |
| Licence tier (ADR 0077)               | PASS   | Free (MIT)                                                                                                                                                       |
| Docs and ADRs                         | PASS   | A dated amendment note on ADR 0511 and a line on 0141; outbox README and AGENTS; a runbook page; AGENTS.md "Services"                                            |

## Deploy modes

| Mode       | Behaviour                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| SaaS       | Producer and consumer in one region; the relay posts to the consumer's public API origin through the generated gateway       |
| On-prem    | The same inside the customer's network; subscribers' origins are the customer's own hosts                                    |
| Air-gapped | Works when producer and consumer run inside the network; no call leaves it; keys are set by the operator in the secret store |

## Correctness properties

- **P-001**: an event leaves the producer only through an outbox delivery row, never from a request handler —
  Validates: FR-001
- **P-002**: every delivery request carries a signature over id, time and body, by the producer's key named by its id
  — Validates: FR-002, FR-013
- **P-003**: a failing subscriber's deliveries back off independently and dead-letter after their attempts, and a
  healthy subscriber's deliveries in the same tick are sent — Validates: FR-003
- **P-004**: the sent envelope carries `envelopeVersion`, and the handled one carries the `producer` of the verifying
  contract whatever the body says — Validates: FR-004, FR-017
- **P-005**: verification (signature, window, listed key) runs before the body is parsed, and any failure records
  nothing and runs no listener — Validates: FR-005, FR-006, FR-019
- **P-006**: a verified delivery claims the event id and runs the listeners in one transaction; a repeated id is
  acknowledged and not run — Validates: FR-007, FR-008
- **P-007**: a sibling consumer's generated subscription is byte-identical to today's, and the relay writes no
  delivery for it — Validates: FR-009
- **P-008**: gen passes for a listener on a contract-only producer's event and emits the inbox and subscription;
  it still refuses an undeclared event; it emits no inbox for a service without such a listener — Validates: FR-010,
  FR-011, FR-018
- **P-009**: deliveries go only to subscribers whose configured events include the type — Validates: FR-012
- **P-010**: delivery state is listable per subscriber and a dead delivery can be replayed once — Validates: FR-014
- **P-011**: runway's schema accepts secret names only for the signing key — Validates: FR-015
- **P-012**: a producer's manifest carries its public keys and subscriber names per environment from runway config —
  Validates: FR-016
- **P-013**: gen warns, naming consumer, producer and event, for a listener the producer's manifest does not list —
  Validates: FR-020

## Architecture overview

```
producer app (pay)                                         consumer app (billing)
 action ─tx─▶ outbox.messages                               generated /events/inbox (api.raw, no session auth)
              │ OutboxRelayService.publish                    │ RelayInboxService.receive(request)
              ├─▶ EventPublisher (in-app, unchanged, d14)     │   1 InboxVerifier: key id ∈ pinned contract keys,
              └─▶ CrossAppFanOut ─▶ outbox.deliveries         │     Ed25519 over id.time.body, 5-min window
                    (one row per subscriber × event version)  │   2 parse envelope, producer := contract's service
              CrossAppRelayService (own lock)                 │   3 InboxService.receive → claim id + listeners, 1 tx
                    └─ POST signed ──────────────────────────▶│   answers 204 / 401 / 422
              SubscriberSource ◀── runway env `events` (first source; Control Plane later)
```

The verifier is the STA-1792 seam: STA-1792 replaces `ContractInboxVerifier` and `Ed25519EventSigner` with a workload
identity, and nothing else moves.

## Components and responsibilities

`@stackra/outbox`

- `SubscriberSource` (port, `contracts/ports/`): `subscribersOf(type)`. First driver `ConfigSubscriberSource` reads the
  `EventsRelayConfig` that runway sets per environment.
- `EventSigner` (port) and `Ed25519EventSigner` (driver): signs `<id>.<time>.<body>` with the private key read from the
  secret store by name; heads `webhook-id`, `webhook-timestamp`, `webhook-signature: v1a,<key id>,<b64>` (R-4).
- `InboxVerifier` (port) and `ContractInboxVerifier` (driver): the key table gen emits from the pinned contracts;
  returns the verified producer or a refusal reason. The STA-1792 seam.
- `DeliveryDriver` (port), `PostgresDeliveryDriver` and `MemoryDeliveryDriver`: `write`, `due` (per subscriber,
  fair), `retry`, `deadLetter`, `remove`, `list`, `replay`.
- `CrossAppFanOut` (service): called by `OutboxRelayService.publish` after the in-app publish; writes one delivery per
  subscriber of the type, insert-or-ignore on (event id, subscriber, type), so a relay retry does not duplicate.
- `CrossAppRelayService` (service): its own lock (`outbox.cross-app`); per tick takes due deliveries grouped by
  subscriber, sends subscribers in parallel and each subscriber's rows in order, stops a subscriber at its first failure
  in the tick, 10-second request timeout, no redirects; back-off and 10 attempts as the outbox; 4xx other than 408 and
  429 dead-letters at once.
- `RelayInboxService` (service): verify, parse (`CrossAppEnvelope` schema), set `producer`, then
  `InboxService.receive`; maps results to 204 (handled or already received, or a newer version that waits), 401
  (unverified), 422 (schema).
- `RelayDeliveriesCommand` and `RelayReplayCommand` (CLI commands, operator only): list per subscriber and state, and
  replay one dead delivery.

`@stackra/gen` (the lead session's gen area: contract and event checks, inbox generation)

- `emit-clients`: lift `client_event_remote_transport` for a contract-only producer; register the listener for inbox
  delivery as for a sibling, without an Encore topic.
- `emit-inbox` (new): `.stackra/gen/inbox.ts`, `InboundEventsController extends Controller({ path: "/events/inbox" })`
  over the raw body, and the pinned producers' key table; only for a service with a contract-only listener.
- `emit-encore-inbox` (new): `.stackra/encore/<member>/inbox.ts`, the `api.raw` adapter (`expose: true`, no session
  auth, `POST /events/inbox`) through `answerHttp`. Gen has no general per-controller raw adapter today; this adds the
  inbox's only (finding F-1).
- `build-manifest`: a `relay` section with the producer's public keys and subscriber names and events per environment,
  read from `runway.yaml`.
- `check-subscriptions` (new): warning `client_event_unsubscribed`.
- `generate()`'s options are untouched; STA-1947's optional `loader` field is merged around.

`@stackra/runway`: `SERVICE_ENVIRONMENT_SCHEMA` gains `events` (signing key secret name, public keys, subscribers),
and the deploy writes `EventsRelayConfig` into the service's environment.

`@stackra/contracts`: `StackraManifest` gains the optional `relay` section.

## Files and folders

- `packages/runtime/outbox/src/contracts/ports/{subscriber-source,event-signer,inbox-verifier,delivery-driver}.port.ts`
- `packages/runtime/outbox/src/contracts/types/{cross-app-envelope,subscriber,delivery,verified-sender}.type.ts`
- `packages/runtime/outbox/src/core/drivers/{config-subscriber-source,ed25519-event-signer,contract-inbox-verifier,memory-delivery}.driver.ts`
- `packages/runtime/outbox/src/core/schemas/cross-app-envelope.schema.ts`
- `packages/runtime/outbox/src/core/constants/cross-app-defaults.constant.ts`
- `packages/runtime/outbox/src/node/database/migrations/0003-create-deliveries.migration.ts`
- `packages/runtime/outbox/src/node/drivers/postgres-delivery.driver.ts`
- `packages/runtime/outbox/src/node/services/{cross-app-fan-out,cross-app-relay,relay-inbox}.service.ts`, and
  `outbox-relay.service.ts` (one call into the fan-out)
- `packages/runtime/outbox/src/node/commands/{relay-deliveries,relay-replay}.command.ts`
- `packages/developer/gen/src/core/functions/{emit-inbox,emit-encore-inbox,check-subscriptions}.function.ts`, and
  `emit-clients`, `build-manifest`, `generate-member` (registration of the new files)
- `packages/developer/gen/__golden__/cross-app-consumer/` and `cross-app-producer/`
- `packages/developer/runway/src/core/constants/service-environment-schema.constant.ts`
- `packages/foundation/contracts/src/core/types/stackra-manifest.type.ts`
- tests beside each in `__tests__/`; `.changeset/sta-1910-*.md` (minor: outbox, gen, runway, contracts)
- `apps/docs/src/docs/adr/0511-…mdx` (dated note), `0141-…mdx` (one line), a runbook page under
  `apps/docs/src/docs/runbooks/`, `AGENTS.md` "Services", the outbox README and AGENTS

## Data models and migrations

See `data-model.md`. One table, `outbox.deliveries`: id (`dlv_`), event id, subscriber member, event type with
version, envelope (jsonb), attempts, available at, last error, dead at, created at; unique (event id, subscriber,
type); index on available at where dead at is null. No RLS: it is the producer service's own operational table, as
`outbox.messages` is. `outbox.inbox` is unchanged. Retention: delivered rows are deleted; dead rows follow
`pruneDead`.

## Contracts

See `contracts/`. The inbox: `POST /events/inbox` with the cross-app envelope and the three signature headers;
answers 204, 401 or 422. The manifest's `relay` section. Runway's `events` block. The CLI commands
`stackra outbox:relay-deliveries` and `stackra outbox:relay-replay <dlv_id>`. No action, query or event is added, so no
MCP tool appears.

## Error handling

- Producer: a network error, 5xx, 408 or 429 retries with back-off; another 4xx dead-letters at once (a permanent
  refusal, EC-05); after 10 attempts a delivery is dead and logged with subscriber, type and code. A fan-out failure
  fails the outbox message, which retries; the unique key keeps the rows single.
- Consumer: 401 for a missing, malformed, stale, unknown-key or bad signature, with a log line naming the reason and
  never the body; 422 for an envelope that breaks its schema (nothing recorded); 204 when handled, already received,
  or newer than the consumer reads (the older version under the same id is the one handled, EC-01). A listener that
  throws rolls back the claim, so the delivery retries.

## Security and tenancy

- Keys: Ed25519. The private key is a secret named in runway (`STACKRA_EVENTS_SIGNING_KEY`), read through the secret
  store at boot, never logged. Public keys and key ids are plain config, copied into the manifest and so into the
  contract; the registry's trusted publisher (ADR 0511 d5) is what makes a consumer trust them. Rotation lists the
  next key beside the current (FR-019).
- The inbox verifies before parsing, refuses outside a five-minute window, and accepts only a key listed for the
  running environment (`STACKRA_ENVIRONMENT`) by a producer the consumer pins. `producer` is the contract's service.
- Outbound: only configured inbox origins, `https` outside `dev`, no redirects, 10-second timeout.
- Tenancy: handling runs under the envelope's scope and actor (`InboxService`'s `CallIsolation` path); no tenant data
  is added; payloads are what events already carry.
- Reviews: `security-tenancy-reviewer` (blocking), `api-contract-reviewer`, `code-reviewer`.

## Testing strategy

- Unit (`@stackra/outbox`): signer and verifier table (unsigned, wrong signature, stale, future, unknown key, key of
  another producer, body tampered, rotated key) for AC-003, AC-007, AC-008; fan-out filters by subscriber events
  (P-009) and dedupes on retry; relay fairness and back-off with a fake clock and transport (AC-005, SC-005); inbox
  maps results to 204, 401, 422 and runs listeners once on a repeat (AC-002); memory driver against the 1,000-delivery
  replay (SC-003).
- Integration on the testbed: `PostgresDeliveryDriver` and the claim-plus-handle transaction against Postgres.
- Gen goldens: a consumer with a contract-only listener (inbox, Encore adapter, key table; AC-004 shape, AC-009), a
  sibling consumer byte-identical (AC-006, SC-006), a producer manifest's `relay` section (P-012), the warning
  (P-013), the unchanged `client_event_unknown` refusal.
- End to end (SC-001, AC-001): on a testbed box, pay and billing run with core's packages linked, the relay between
  them; a captured payment is handled once by billing (`quickstart.md`). Recorded on the PR.
- SC-004: gen in figentra/billing and figentra/os scheduling-calendar on the box, outputs cited on the PR.

## Rollout

1. Core PR (this spec): packages, gen, docs and changesets; released by the owner.
2. figentra/pay: a runway `events` block per environment (subscribers billing and os scheduling-calendar, public keys);
   the owner sets `STACKRA_EVENTS_SIGNING_KEY` per environment; release republishes the payments contract with keys.
3. figentra/billing and figentra/os: bump the payments contract, regenerate; their gen passes; STA-1936's PR
   regenerates and publishes scheduling-calendar's contract.
4. The owner's dev deploy and the deployed check (Q3 B).
   No flag: a service without an `events` block and without contract-only listeners behaves as today.

## Delegation and risk plan

- Lead session only: signer, verifier, inbox service, gen (R3 and the gen ownership split with STA-1947).
- Waves: W1 contracts type and runway schema; W2 outbox ports, drivers, migration, fan-out, relay (`package-builder`
  may take the memory and Postgres delivery drivers and their tests); W3 gen; W4 docs and the 0511 note
  (`docs-adr-steward`); W5 testbed end-to-end.
- Reviews before the PR leaves draft: `security-tenancy-reviewer`, `api-contract-reviewer`, `code-reviewer`.
- Budget: about two working days of the lead session, testbed runs per wave.

## ADRs

- Relies on ADR 0511 (Proposed; decisions 11 to 15), 0141 (its 2026-11-01 note), 0260 (decision 4 as amended), 0078,
  0142, 0173, 0227, 0237, 0294 (decision 16).
- Opens a dated amendment note on ADR 0511: the producer key in the manifest's `relay` section (an addition to
  decision 1's manifest, not a fourth file), the runway subscriber list behind `SubscriberSource`, the inbox route, and
  STA-1792 as the later replacement. ADR 0511 is Proposed; the owner accepts it with this note before the core PR
  merges.

## Docs

- `apps/docs/src/docs/adr/0511-cross-repo-service-contracts-and-cross-app-events.mdx` (dated note; Enforcement lines
  for decisions 11 to 15 become automated)
- `apps/docs/src/docs/adr/0141-integration-event-names-and-envelope.mdx` (one line under its 2026-11-01 note)
- `apps/docs/src/docs/runbooks/cross-app-event-relay.mdx` (new: subscribers, keys and rotation, dead letters, replay)
- `packages/runtime/outbox/README.md` and `AGENTS.md`; `packages/developer/gen/README.md` (the new files);
  `AGENTS.md` "Services" (ADR 0511 Consequences)

## Complexity tracking

none

## Findings for the leader

- **F-1**: gen binds raw controllers (the inbound webhook route among them) and writes `answerHttp`, but no emitter
  writes a per-controller Encore `api.raw` adapter, so `/webhooks/*` has no Encore endpoint either. This plan adds the
  inbox's adapter only; a general controller adapter is its own issue.
- **F-2**: `EventEnvelope` in code still names `scope` and `meta`, while ADR 0260's 2026-11-01 note says the fields are
  0141's (`tenant`, `actor`, …). The cross-app envelope keeps today's wire names plus the two new fields; renaming is
  out of scope.
