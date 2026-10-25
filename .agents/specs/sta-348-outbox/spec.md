# Feature Specification: `@stackra/outbox` wave 6, the transactional outbox, relay and inbox

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/outbox` (runtime, wave 6): the transactional outbox of ADR 0078 decision 4. An outbox table
written in the producer's transaction through the ORM subscribers seam @stackra/database left
(`DatabaseOptions.subscribers`); a relay that publishes through a transport port (ADR 0142), one runner per service
under a @stackra/locking lock, with backoff retries from @stackra/queue and dead letters; an inbox table for consumer
deduplication by event id; the driver of @stackra/events' `EventOutbox` port; and the row-change seam @stackra/search
(automatic indexing, ADR 0221 decision 5) and @stackra/segments (wave 7) react through.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce and notifications services list it; they adopt it once
  converted, STA-344)
- **Packages touched**: `packages/runtime/outbox` (new member)
- **Cross-service events**: none declared here; this package carries every service's integration events
- **Tenancy and data**: two tables in the package's own schema. `outbox.messages` carries `scope_id` and `scope_path`
  (`t.scopeId()`, `t.scopePath()`, nullable) taken from the writing transaction's scope settings, and has no
  row-level-security policy because the relay reads every scope's messages (data review); the relay opens each
  message's scope as the session of its delivery. `outbox.inbox` is keyed by event id and carries no scope. No tenant
  vocabulary is declared (R-59, ADR 0323)
- **Secrets**: none
- **ADR needed**: no (ADR 0078 decision 4 decides the outbox, relay and inbox; ADR 0141 the envelope; ADR 0142 the
  transports; ADR 0221 decision 5 indexing through the outbox); the gaps are listed under Open items
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); runtime edges to
  actions, config, container, contracts, database, errors, events, locking, queue and validation
- **Deploy modes**: same code in all; the Postgres stores on every mode, the memory stores for tests and one process
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/runtime/outbox/README.md`, `packages/runtime/outbox/AGENTS.md`; ADR 0078 is cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract every publishing and consuming service relies on)

## Clarifications

### Session 2026-10-25

The package follows ADR 0078, 0141, 0142, the v3.1 registry row ("Transactional outbox, relay, inbox dedup", entry
`.`, no template import) and the owner decisions of 2026-10-24. The choices recorded when it was specified:

- Entries: `.`, `./contracts` (the three ports, the stored types, two enums) and `./node` (the writer, relay, inbox and
  Postgres drivers) exist because each has a file (ADR 0127 note); one symbol, one entry (ADR 0294 d15)
- The write seam is `DatabaseOptions.subscribers`: `OutboxWriterService` takes the integration events each flushed
  model recorded at `onFlush` and writes them at `beforeTransactionCommit` (savepoints included) on that event's entity
  manager, so an action's transaction and an implicit flush transaction are both joined; a rollback drops them. ADR 0097
  d2 keeps MikroORM in @stackra/database, so the ORM arguments are structural types
- Only integration events enter the outbox; any other recorded event goes back on its model, in order, for the
  in-process dispatch that owns it (ADR 0078 d3, ADR 0305 r21)
- The wire name is the locked name gen registers (`registerEventNames`), else the written name and version
- The relay is a polling worker with `Locks.tryWith("outbox.relay")` (one runner per service per tick, ADR 0149), up
  to 100 messages oldest first, a one-second idle poll (ADR 0221's five-second lag), ten attempts with queue's
  exponential `backoffDelay`, then a dead letter and a log line
- Transports are `EventPublisher` drivers (ADR 0142): the in-process `InboxEventPublisherDriver` here; Encore Pub/Sub and
  the on-prem Postgres queue transport are gen's
- The inbox claims the id and runs the bus in one transaction in the event's scope; an unknown wire name is refused
  before the claim (`unknown_event`, retryable)
- Row changes: `registerChangeConsumers([[Model, Consumer]])` watches a model; the writer notes a change message (model,
  key, kind, fields; never values) per flushed row, and the relay hands it to each bound consumer in the row's scope.
  "Hook" is a React word (ADR 0294 d23), so the seam is a change consumer
- Every delivery that opens a scope runs in `withScope(scope ?? [])`, so with the Postgres lock driver (one transaction
  per tick) no scope leaks into the next delivery
- Owner, 2026-10-24: data gate lifted, so the Postgres stores and migrations build now; the model review happens on the
  data-wave PR

## User Scenarios & Testing

### User Story 1 - Publish an integration event after commit (Priority: P1)

An action changes an order and records `OrderPaid`; the event commits with the change and is published after it.

**Independent Test**: `src/node/services/__tests__/outbox-writer.service.test.ts`,
`src/node/services/__tests__/outbox-relay.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** a flush of a model that recorded an integration event, **When** its transaction commits, **Then** one
   message is written inside it with the call's actor and id; a rollback writes nothing.
2. **Given** a due message, **When** the relay ticks, **Then** it is published as its envelope and deleted.

### User Story 2 - Receive an event once (Priority: P1)

A consumer's subscription hands each envelope to the inbox; a redelivered event runs no listener.

**Independent Test**: `src/node/services/__tests__/inbox.service.test.ts`,
`src/node/drivers/__tests__/inbox-event-publisher.driver.test.ts`.

### User Story 3 - Keep messages and ids in Postgres (Priority: P1)

**Independent Test**: `src/node/drivers/__tests__/postgres-outbox.driver.test.ts`,
`src/node/drivers/__tests__/postgres-inbox.driver.test.ts`,
`src/node/database/migrations/__tests__/0001-create-messages.migration.test.ts`,
`src/node/database/migrations/__tests__/0002-create-inbox.migration.test.ts`.

### User Story 4 - React to row changes (Priority: P2)

Search registers a consumer for `Product`; a committed product change reaches it in the row's scope.

**Independent Test**: `src/core/functions/__tests__/register-change-consumers.function.test.ts`,
`src/node/services/__tests__/outbox-relay.service.test.ts`.

### Edge Cases

- A transport that is down: the message waits its backoff and is dead-lettered after the tenth attempt.
- A relay that dies after publishing: the event is published again and the inbox runs it once.
- Two relays: the one that wins the lock ticks; the other handles nothing.
- A received wire name this release does not know: refused before the claim, so a later release receives it.
- A watched row flushed without a primary key: the commit fails rather than skip the change.

## Requirements

- **FR-001**: The package SHALL be `@stackra/outbox` at `packages/runtime/outbox`, `tier:lib`, entries `.`,
  `./contracts` and `./node` only.
- **FR-002**: `OutboxWriterService` SHALL write the integration events of each flush, and a change message per watched
  row, inside the flush's transaction just before it commits, and drop them on rollback; other recorded events SHALL
  stay on their model.
- **FR-003**: `OutboxRelayService` SHALL, under one lock per service, deliver due messages oldest first (events through
  the `EventPublisher`, changes to the bound change consumers in the row's scope), delete delivered ones, and retry
  failed ones with backoff until a dead letter.
- **FR-004**: `InboxService` SHALL run an event's listeners only on the first claim of its id, in one transaction in its
  scope, and refuse an unknown wire name before claiming.
- **FR-005**: The Postgres drivers SHALL bind every value, read every row through zod and take a message's scope from
  the transaction's scope settings; the memory drivers SHALL behave the same in one process.
- **FR-006**: `OutboxEventOutboxDriver` SHALL implement @stackra/events' `EventOutbox` and refuse a domain event.
- **FR-007**: `OutboxConfig` with its shipped `OutboxConfig$` SHALL key `outbox` with `driver` (`postgres` default,
  `memory`).
- **FR-008**: No identifier SHALL declare tenant vocabulary, and the package SHALL import no `@mikro-orm/*` module.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (owner instruction: lint and format only).

## Open items (for the owner, not blocking)

- Domain events: the writer leaves them recorded on the model; nothing dispatches them in process after commit yet. The
  action pipeline's unit of work is the natural owner (@stackra/actions or @stackra/database).
- `InboxService` drains the whole in-process bus, as @stackra/events' `EventBus.drain()` does; under concurrent requests
  that can run another request's queued events inside a receipt. A per-occurrence run needs a seam in @stackra/events.
- Gen needs: `registerEventNames` rows in each generated entry, the writer in `DatabaseOptions.subscribers` at boot,
  `relay.connect(container)` and `relay.work` per service, and the Encore Pub/Sub publisher driver and subscription that
  call `InboxService.receive` (ADR 0142).
- Not built: outbox staging per workflow run (ADR 0102 d3), dead-letter listing and redrive, the retention purges
  (`InboxService.prune` exists; the scheduler calls it), and publishing both versions of an event until a sunset.
- The ADR 0182 coverage floor for the outbox (90/80) is above the shared preset's gate (80/70).

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
