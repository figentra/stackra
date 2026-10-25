# Feature Specification: `@stackra/query` wave 4: the server-state cache, the offline queue and its conflicts

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/query` (state, wave 4) for real. It holds the client's TanStack Query cache, persisted per
principal and scope and refetched live when a query's `cache.invalidateOn` event is broadcast; the offline mutation
queue with idempotency keys, per-aggregate order, retention and conflict records; `offlineMap`; `QueryConfig` with
its shipped schema; `useMutationQueue` and `fakeQueue`. The generated client's query hooks stay in
`@stackra/clients/react` (registry N4).

## Impact

- **Apps touched**: none. The template's console and mobile apps override `QueryConfig`, read the queue and call
  `offlineMap` in their generated `#stackra/offline` (STA-344)
- **Services touched**: none
- **Packages touched**: `packages/state/query` (new member)
- **Cross-service events**: none published. Live refetch subscribes to consumed integration events through
  `@stackra/realtime`
- **Tenancy and data**: no tables. The cache and the queue are client storage, keyed by the principal's public id and
  a contracts `ScopeRef` (R-59); queued inputs and cached results may hold personal data (see the package's PII table)
- **Secrets**: none
- **ADR needed**: no (ADR 0059, 0079, 0225, 0227, 0252, 0256, 0294, 0305, owner decision R-25 and the ADR 0127
  2026-10-24 note)
- **New dependencies**: `@tanstack/query-core` 5.104.1 (MIT, no dependencies) through `catalog:`, the cache engine ADR
  0079 decision 1 names; it is in no catalog yet. The rest come through `workspace:*` (`@stackra/actions`, `config`,
  `container`, `contracts`, `errors`, `platform`, `realtime`, `storage`, `validation`), `zod` through `catalog:`,
  and `react` through `catalog:frontend` as an optional peer
- **Deploy modes**: same in all; the package calls no server itself (the generated client sends queued calls)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/state/query/README.md`, `packages/state/query/AGENTS.md`; ADR 0059, 0079, 0225, 0252, 0256 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (a queued write is user work: it is persisted before `enqueue` resolves, never replayed for
  another principal, and never overwritten silently)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24. The choices made when it was
specified:

- Owner, R-59: no tenant vocabulary. `QueryScope` has `active_scope` (principal and `ScopeRef`, the default) and
  `principal`; the template's `QueryScope.Tenant` becomes `QueryScope.ActiveScope` in STA-344
- Owner, R-25: a query that declares `cache.invalidateOn` is live; the cache subscribes through `@stackra/realtime`'s
  connection and reimplements no transport
- ADR 0227 and ADR 0059: no sync engine; replay is the action call with the Idempotency-Key minted at queue time, and a
  `409` is a conflict record a person resolves
- Builder, recorded for review: the queue needs a sender, so `./contracts` adds a `MutationSender` port that
  `@stackra/clients` implements (it knows routes, session and scope headers). The `QueueLeader` drivers stay in
  `@stackra/coordinator` as the template wires them

## User Scenarios & Testing

### User Story 1 - Keep working offline (Priority: P1)

A till user creates an order with no network. The generated client queues it with `queue.enqueue(CreateOrderAction,
input, orderId)`. The banner shows "1 change waiting". When the network returns, the leading tab replays the call with
the same Idempotency-Key and the count drops to zero.

**Independent Test**: `packages/state/query/src/core/services/__tests__/mutation-queue.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** an action the offline map lists, **When** it is queued offline, **Then** `enqueue` resolves only after
   the call is persisted, and `pending` is 1.
2. **Given** an action the map does not list, **When** it is queued, **Then** `enqueue` rejects with `OfflineError`
   and nothing is stored.
3. **Given** calls on two aggregates, **When** the network returns, **Then** each aggregate replays first in, first
   out, at most `maxParallelAggregates` at once.

### User Story 2 - Resolve a conflict (Priority: P1)

An archive queued offline meets a newer server version. The pending-changes view shows the conflict with the server's
record and offers the resolutions the action declared. The person picks one, or discards the change.

**Independent Test**: `packages/state/query/src/core/services/__tests__/mutation-queue.service.test.ts`,
`packages/state/query/src/core/functions/__tests__/offline-map.function.test.ts`.

### User Story 3 - See fresh data after a restart and live updates (Priority: P2)

The dashboard opens from the persisted cache after a cold start, then refetches the KPI query when an `OrderPaid`
refresh arrives.

**Independent Test**: `packages/state/query/src/core/services/__tests__/server-state-cache.service.test.ts`.

### User Story 4 - Test a screen that reads the queue (Priority: P2)

A test renders the offline banner with `fakeQueue({ pending: 2 })` and asserts the count.

**Independent Test**: `packages/state/query/src/testing/__tests__/queue.fake.test.ts`,
`packages/state/query/src/react/mutation-queue/__tests__/use-mutation-queue.test.tsx`.

### Edge Cases

- A send that never reached the server (offline, `401`, `429`, `5xx`, a throw) keeps the call and stops its aggregate.
- A call older than its retention is not sent: it becomes a `stale_offline_mutation` conflict.
- A stored queue this version cannot read makes `open` reject and is left untouched; the queue stays closed.
- A failed persist on `enqueue` removes the call again: not durable means not queued.
- `client_retry` on an action that does not offer it is refused with a `RangeError`.
- A scope or user switch empties the cache and opens the other partition's queue, so nothing crosses principals.

## Requirements

- **FR-001**: The package SHALL be `@stackra/query` at `packages/state/query`, `tier:lib`, with entries `.`,
  `./contracts`, `./react` and `./testing`.
- **FR-002**: It SHALL export every symbol the template imports from it: `.` `QueryConfig`, `QueryConfig$`,
  `QueryScope`, `offlineMap`; `./contracts` `QueryPersister`, `QueueLeader`; `./react` `ConflictRecord`(t),
  `PendingMutation`(t), `useMutationQueue`; `./testing` `fakeQueue`.
- **FR-003**: `QueryConfig` SHALL be a `Config({ schema })` class keyed `query` with safe defaults (keyed by principal
  and scope, cache persisted only encrypted, replay on reconnect), and `QueryConfig$` its shipped schema.
- **FR-004**: The queue SHALL persist a call before `enqueue` resolves, give it an Idempotency-Key that every replay
  sends, and replay per aggregate first in, first out, only while this context leads and is online.
- **FR-005**: A refusal for good or an expired call SHALL become a conflict record holding the call and the server's
  record. It SHALL block later calls on its aggregate until it is resolved or discarded, and never be overwritten
  silently.
- **FR-006**: The cache SHALL be the TanStack Query client configured from `QueryConfig`. It SHALL be emptied on every
  `open`, persisted only through an encrypting persister while `persistEncrypted` is on, and restored only under the
  same buster within `persistMaxAgeHours`.
- **FR-007**: A watched query SHALL be invalidated on each broadcast of an event its `invalidateOn` names, through
  `@stackra/realtime`'s connection.
- **FR-008**: No identifier, code or text SHALL use tenant vocabulary; partitions SHALL use the principal's public id
  and a contracts `ScopeRef`.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package, and `validate-repository.mjs` reports nothing for it.

## Open items (for the owner, not blocking)

- The template's generated wiring imports `IndexedDbQueryPersisterDriver` (`@stackra/query/browser`) and
  `EncryptedSqliteQueryPersisterDriver` (`@stackra/query/native`). This package ships one `storage` driver over
  `@stackra/storage` (ADR 0256); an encrypting persister is needed before the cache persists with
  `persistEncrypted` on.
- `@stackra/coordinator` does not ship `MemoryQueueLeaderDriver` or `BroadcastChannelQueueLeaderDriver` yet, and the
  mobile wiring binds no `QueueLeader`.
- `@tanstack/query-core` needs a catalog pin; the template's `QueryScope.Tenant` becomes
  `QueryScope.ActiveScope` (R-59).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
