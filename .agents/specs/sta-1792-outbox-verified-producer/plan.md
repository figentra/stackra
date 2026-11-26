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
`SubjectRedaction`, and `output` reports `unredacted`. `insertMessages` checks the batch for an event whose class has
a `@Classified` field and, if it finds one, reads `app.tenant_id` and refuses when it is empty.

## Files and folders

```text
packages/foundation/events/src/{core/types/listener-context.type.ts, contracts/types/recorded-event.type.ts,
  core/services/event-bus.service.ts, testing/functions/{deliver-remote-event,drain-outbox}.function.ts,
  testing/types/events-harness.type.ts} + tests, README.md
packages/runtime/outbox/src/{contracts/types/{event-envelope,subject-redaction}.type.ts,
  contracts/ports/outbox-driver.port.ts, core/errors/platform-personal-event.error.ts,
  core/drivers/memory-outbox.driver.ts, core/functions/redact-subject-messages.function.ts,
  node/drivers/{inbox-event-publisher,postgres-outbox}.driver.ts, node/functions/insert-messages.function.ts,
  node/services/{outbox-relay,inbox,relay-inbox,cross-app-fan-out,outbox-writer}.service.ts} + tests,
  node/__tests__/outbox-erasure.int.test.ts, README.md, AGENTS.md, stackra.manifest.json
packages/developer/gen/src/core/functions/{emit-encore-events,emit-boot}.function.ts + tests
packages/application/actions/src/{config/approvals.config.ts, core/schemas/approvals-options.schema.ts,
  core/constants/approvals-config-schema.constant.ts, node/listeners/approval-executor.listener.ts} + tests,
  removed contracts/ports/approval-grant-origin.port.ts, README.md, stackra.manifest.json
packages/security/privacy/src/node/{workflows/erase-subject.workflow.ts, schemas/erase-subject-output.schema.ts}
  + tests, AGENTS.md, stackra.manifest.json
apps/docs/src/docs/build/approvals.mdx
.changeset/{outbox-verified-producer,outbox-unredactable-personal-data}.md
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

A body can no longer name its producer: the field is stamped by the relay and ignored by every receiver. The broker
path relies on gen declaring each topic only in its publishing service's events file, so the topic proves the
producer. The tenant read is the transaction's setting, never input.

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
