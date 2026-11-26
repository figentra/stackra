# Implementation Plan: a verified producer on every delivered event, and erasure that reports what it cannot reach

**Spec**: `.agents/specs/sta-1792-outbox-verified-producer/spec.md` · **Linear**: STA-1792, STA-2629 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-1792-outbox-verified-producer/spec.md`

## Summary

The producer of a delivered event becomes a fact the transport proves and the bus hands to listeners as
`ctx.producer`. The relay stamps its own service on every envelope; the receiving side never trusts that field of a
body and takes the producer from its transport: the generated subscription's topic owner, the cross-app signer, or the
in-process relay. The approval executor checks it against a configured store service, and the interim port goes.
Erasure learns which held messages it could not rewrite and reports them; the outbox refuses personal events that
would land where no erasure can reach.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/foundation/events`, `packages/runtime/outbox`, `packages/developer/gen`,
  `packages/application/actions`, `packages/security/privacy`
- **Testing**: vitest unit tests in `src/**/__tests__/`; one Postgres integration file (`.int`)
- **Storage**: the existing `outbox.messages` table; no migration

## Constitution Check

| Law                                   | Result | Note                                                                     |
| ------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import edge; privacy already depends on outbox                    |
| Secrets (ADR 0009)                    | PASS   | none read or written                                                     |
| Security                              | PASS   | origin is proven by the transport, never claimed by the body             |
| HTTP and events                       | PASS   | no route or event schema change; the cross-app body never sends producer |
| Tenancy                               | PASS   | the tenant is read from the transaction, never from input                |
| Delegation                            | PASS   | Claude only                                                              |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                                    |
| Versions and catalogs                 | PASS   | minor changesets for the five packages                                   |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                        |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                |
| Docs and ADRs                         | PASS   | READMEs, AGENTS.md files, the approvals guide                            |

## Deploy modes

| Mode       | Behaviour                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------- |
| SaaS       | Encore Pub/Sub topics; the relay's `publishes` and `receiveFromTopic` bind the producer to sender |
| On-prem    | same, on the self-hosted broker or the in-process publisher                                       |
| Air-gapped | same as on-prem                                                                                   |

## Correctness properties

- **P-001**: a `producer` in metadata or a body never reaches `ctx.producer` — Validates: AC-001, AC-003
- **P-002**: every envelope a connected relay publishes names that relay's service — Validates: AC-002
- **P-003**: each transport passes the producer it proved — Validates: AC-004, AC-005
- **P-004**: the executor runs a grant only from the configured store — Validates: AC-006
- **P-005**: a platform message holding the subject is reported, unchanged, never counted as redacted — Validates:
  AC-007, AC-008
- **P-006**: a classified event is never written as a platform row — Validates: AC-009

## Architecture overview

Producer path: `OutboxRelayService.envelopeOf` adds `producer` from `connect`'s identity. The envelope reaches a
consumer through one of three transports, each of which calls `InboxService.receive(envelope, producer)` with what it
proved. `InboxService` strips any claimed producer from the metadata, builds the relays' context with the verified one
and calls `EventBus.deliver(event, meta, producer)`; the bus keeps it on the `RecordedEvent` and spreads it into each
listener's context.

Erasure path: `redactSubjectMessages` reads `holding(subject)` and calls `rewrite`, which now answers whether a row
changed (`update … returning id` on Postgres). A `false` counts as `unrewritable`. The saga's `redact` step returns the
`SubjectRedaction`; `receipt` records `SubjectErased` with `unredacted` and a `kept` entry of reason `unredacted`, puts
the same entry in the `ServiceAcked` ack (so the waiting service's `AllServicesAcked.kept` shows it) and warns the
bound `Logger`; `output` reports `unredacted` and the same `kept`. `insertMessages` checks the batch for an event whose class has
a `@Classified` field and, if it finds one, reads `app.tenant_id` and refuses when it is empty.

## Components and responsibilities

- `EventBus` (`packages/foundation/events/src/core/services/event-bus.service.ts`): sets `ctx.producer` only from
  `deliver`'s third argument.
- `OutboxRelayService` (`packages/runtime/outbox/src/node/services/outbox-relay.service.ts`): stamps its service on
  every envelope; with `publishes`, dead-letters another service's event unpublished.
- `InboxService` (`packages/runtime/outbox/src/node/services/inbox.service.ts`): `receive(envelope, producer?)` hands
  listeners only the verified producer; `receiveFromTopic(envelope, owner)` takes the topic owner only with an
  agreeing relay stamp.
- `RelayInboxService`, `InboxEventPublisherDriver`, `CrossAppFanOut`: pass the signer, pass their own relay's stamp,
  send no producer.
- `emitBoot`, `emitEncoreEvents`, `integrationWireNames` (`packages/developer/gen/src/core/functions/`): the boot's
  relay identity with `publishes`; subscriptions through `receiveFromTopic`.
- `ApprovalExecutorListener` (`packages/application/actions/src/node/listeners/approval-executor.listener.ts`): acts
  only for `ApprovalsConfig.storeService`.
- `redactSubjectMessages`, `OutboxDriver.rewrite`, `insertMessages` (`packages/runtime/outbox/src/`): count what
  cannot be rewritten; refuse a classified event with no tenant.
- `EraseSubjectWorkflow` (`packages/security/privacy/src/node/workflows/erase-subject.workflow.ts`): carries the
  unredacted count to `SubjectErased`, the `ServiceAcked` ack's `kept` and the receipt, and warns.

## Files and folders

```text
apps/docs/src/docs/build/approvals.mdx
packages/application/actions/README.md
packages/application/actions/src/config/approvals.config.ts
packages/application/actions/src/config/__tests__/approvals.config.test.ts
packages/application/actions/src/contracts/index.ts
packages/application/actions/src/contracts/ports/approval-grant-origin.port.ts
packages/application/actions/src/contracts/__tests__/index.test.ts
packages/application/actions/src/core/constants/approvals-config-schema.constant.ts
packages/application/actions/src/core/index.ts
packages/application/actions/src/core/schemas/approvals-options.schema.ts
packages/application/actions/src/core/__tests__/index.test.ts
packages/application/actions/src/node/listeners/approval-executor.listener.ts
packages/application/actions/src/node/listeners/__tests__/approval-executor.billing.test.ts
packages/application/actions/src/node/listeners/__tests__/approval-executor.listener.test.ts
packages/application/actions/stackra.manifest.json
packages/developer/gen/src/core/functions/emit-boot.function.ts
packages/developer/gen/src/core/functions/emit-encore-events.function.ts
packages/developer/gen/src/core/functions/integration-wire-names.function.ts
packages/developer/gen/src/core/functions/__tests__/emit-boot.function.test.ts
packages/developer/gen/src/core/functions/__tests__/emit-encore-events.function.test.ts
packages/foundation/events/README.md
packages/foundation/events/src/contracts/types/recorded-event.type.ts
packages/foundation/events/src/core/services/event-bus.service.ts
packages/foundation/events/src/core/services/__tests__/event-bus.service.test.ts
packages/foundation/events/src/core/types/listener-context.type.ts
packages/foundation/events/src/testing/functions/deliver-remote-event.function.ts
packages/foundation/events/src/testing/functions/drain-outbox.function.ts
packages/foundation/events/src/testing/functions/__tests__/deliver-remote-event.function.test.ts
packages/foundation/events/src/testing/functions/__tests__/drain-outbox.function.test.ts
packages/foundation/events/src/testing/types/events-harness.type.ts
packages/runtime/outbox/AGENTS.md
packages/runtime/outbox/README.md
packages/runtime/outbox/src/contracts/index.ts
packages/runtime/outbox/src/contracts/ports/outbox-driver.port.ts
packages/runtime/outbox/src/contracts/ports/__tests__/outbox-driver.port.test.ts
packages/runtime/outbox/src/contracts/__tests__/index.test.ts
packages/runtime/outbox/src/contracts/types/event-envelope.type.ts
packages/runtime/outbox/src/contracts/types/subject-redaction.type.ts
packages/runtime/outbox/src/core/constants/outbox-log-events.constant.ts
packages/runtime/outbox/src/core/drivers/memory-outbox.driver.ts
packages/runtime/outbox/src/core/drivers/__tests__/memory-outbox.driver.test.ts
packages/runtime/outbox/src/core/errors/platform-personal-event.error.ts
packages/runtime/outbox/src/core/functions/redact-subject-messages.function.ts
packages/runtime/outbox/src/core/functions/__tests__/redact-subject-messages.function.test.ts
packages/runtime/outbox/src/core/index.ts
packages/runtime/outbox/src/core/__tests__/index.test.ts
packages/runtime/outbox/src/node/drivers/inbox-event-publisher.driver.ts
packages/runtime/outbox/src/node/drivers/postgres-outbox.driver.ts
packages/runtime/outbox/src/node/drivers/__tests__/inbox-event-publisher.driver.test.ts
packages/runtime/outbox/src/node/drivers/__tests__/postgres-outbox.driver.test.ts
packages/runtime/outbox/src/node/functions/insert-messages.function.ts
packages/runtime/outbox/src/node/functions/__tests__/insert-messages.function.test.ts
packages/runtime/outbox/src/node/services/cross-app-fan-out.service.ts
packages/runtime/outbox/src/node/services/inbox.service.ts
packages/runtime/outbox/src/node/services/outbox-relay.service.ts
packages/runtime/outbox/src/node/services/outbox-writer.service.ts
packages/runtime/outbox/src/node/services/relay-inbox.service.ts
packages/runtime/outbox/src/node/services/__tests__/cross-app-fan-out.service.test.ts
packages/runtime/outbox/src/node/services/__tests__/inbox.service.test.ts
packages/runtime/outbox/src/node/services/__tests__/outbox-relay.service.test.ts
packages/runtime/outbox/src/node/services/__tests__/relay-inbox.service.test.ts
packages/runtime/outbox/src/node/__tests__/outbox-erasure.int.test.ts
packages/runtime/outbox/stackra.manifest.json
packages/runtime/workflow/src/contracts/constants/kept-records-schema.constant.ts
packages/runtime/workflow/src/contracts/constants/__tests__/service-acked-schema.constant.test.ts
packages/runtime/workflow/src/contracts/types/kept-records.type.ts
packages/security/privacy/AGENTS.md
packages/security/privacy/src/contracts/types/erasure-receipt.type.ts
packages/security/privacy/src/core/events/subject-erased.event.ts
packages/security/privacy/src/core/events/__tests__/subject-erased.event.test.ts
packages/security/privacy/src/node/schemas/erase-subject-output.schema.ts
packages/security/privacy/src/node/workflows/erase-subject.workflow.ts
packages/security/privacy/src/node/workflows/__tests__/erase-subject.workflow.test.ts
packages/security/privacy/stackra.manifest.json
packages/developer/gen/__golden__/ (the boot and subscription goldens of every service fixture)
```

## Data models and migrations

None.

## Contracts

See the spec's Impact. Breaking: `OutboxDriver.rewrite` resolves a boolean; `redactSubjectMessages` resolves
`{ rewritten, unrewritable }`; `ApprovalGrantOrigin` is removed (set `actions.approvals.storeService` instead);
`ApprovalExecutorListener`'s third constructor argument is `ApprovalsConfig`. Additive elsewhere.

## Error handling

`PlatformPersonalEventError` (kind internal, not retryable, code `platform_personal_event`) fails the transaction that
recorded the event, before any row is written. A delivery from another producer is dropped by the executor and logged
by approval id with reason `origin`, as before.

## Security and tenancy

A body can no longer name its producer: the field is stamped by the relay from its deployment identity. A topic
alone does not prove the sender: a consumer imports the producer's events file for its subscriptions, which
registers the producer's topic publishers in the consumer's process too, and it can record the producer's event class
it imports from `#stackra/clients`. Two checks close that: the relay publishes only the wire names its service's
manifest lists (`publishes`, from the generated boot) and dead-letters any other, and the generated subscription calls
`receiveFromTopic`, which takes the topic's owner as the producer only when the relay's stamp names the same service.
Code that bypasses the relay and publishes to a topic by hand is outside this guarantee. The tenant read is the
transaction's setting, never input.

## Testing strategy

- AC-001: `event-bus.service.test.ts` ("gives ctx.producer only from deliver's verified producer…"),
  `drain-outbox.function.test.ts`, `deliver-remote-event.function.test.ts`.
- AC-002: `outbox-relay.service.test.ts` ("stamps its own service…"), `outbox-erasure.int.test.ts` (third case).
- AC-003: `inbox.service.test.ts` (listeners and relays).
- AC-004: `relay-inbox.service.test.ts`, `inbox-event-publisher.driver.test.ts`, `emit-encore-events.function.test.ts`,
  `emit-boot.function.test.ts`.
- AC-005: `cross-app-fan-out.service.test.ts` (the relay now names a producer; the delivery has none).
- AC-006: `approval-executor.listener.test.ts` (other producer, none, unconfigured), `approval-executor.billing.test.ts`,
  `approvals.config.test.ts`.
- AC-007: `postgres-outbox.driver.test.ts`, `memory-outbox.driver.test.ts`, `outbox-erasure.int.test.ts`.
- AC-008: `redact-subject-messages.function.test.ts`, `erase-subject.workflow.test.ts` (incl. a stored bare count).
- AC-009: `insert-messages.function.test.ts`, `outbox-erasure.int.test.ts`.
- AC-010: `outbox-relay.service.test.ts` ("dead-letters, unpublished, an event of a wire name its service does not
  publish…", "never delivers another service's event, recorded by a consumer, with that service as its producer"),
  `emit-boot.function.test.ts` ("gives the relay the wire names the built manifest publishes…").
- AC-011: `erase-subject.workflow.test.ts` ("reports a held platform message it could not rewrite as unredacted"),
  `subject-erased.event.test.ts`, `service-acked-schema.constant.test.ts`.

## Rollout

Minor changesets. Services pick up the generated subscription and boot changes on their next `stackra gen`; until then
an envelope names no producer and the executor drops grants (fail closed), so an owning service regenerates and sets
`actions.approvals.storeService` in the same release.

## Known risks

- The Postgres integration file was written but not run here: box 2's root disk was full, so no Postgres container
  could start. It runs where `TESTBED_POSTGRES_HOST` is set.
- An in-flight erasure run started before this change stored `redact` as a number; `redactionOf` reads it (tested).

## Delegation and risk plan

Claude only; one wave. R3: the change waits for the CTO's approval stop and an independent review before it merges.

## ADRs

ADR 0509 decision 7, ADR 0511 decisions 11 and 19, ADR 0239 (2026-11-07 amendment, gap C), ADR 0189 decision 2.

## Docs

The READMEs and AGENTS.md files listed in the spec, the approvals guide, two changesets.

## Complexity tracking

none
