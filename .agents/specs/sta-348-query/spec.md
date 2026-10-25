# Feature Specification: `@stackra/query` wave 4: the server-state cache, the offline queue and its conflicts

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348 (wave 9 offline additions: STA-488)

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/query` (state, wave 4) for real. It holds the client's TanStack Query cache, persisted per
principal and scope and refetched live when a query's `cache.invalidateOn` event is broadcast; the offline mutation
queue with idempotency keys, per-aggregate order, retention and conflict records; `offlineMap`; `QueryConfig` with
its shipped schema; `useMutationQueue` and `fakeQueue`. The generated client's query hooks stay in
`@stackra/clients/react` (registry N4). Wave 9 (STA-488) completes the offline queue with ADR 0338: per-device order,
caps, bounded replicas with an "as of" time (`ReplicaStore`, `useReplica`), sealed persistence and the offline lock
that wipes a revoked or long-offline device.

## Impact

- **Apps touched**: none. The template's console and mobile apps override `QueryConfig`, read the queue and call
  `offlineMap` in their generated `#stackra/offline` (STA-344)
- **Services touched**: none
- **Packages touched**: `packages/state/query` (new member); wave 9 adds the drivers of its offline ports in
  `packages/application/clients` and `packages/security/identity` (their own specs)
- **Cross-service events**: none published. Live refetch subscribes to consumed integration events through
  `@stackra/realtime`
- **Tenancy and data**: no tables. The cache and the queue are client storage, keyed by the principal's public id and
  a contracts `ScopeRef` (R-59); queued inputs and cached results may hold personal data (see the package's PII table)
- **Secrets**: none
- **ADR needed**: no (ADR 0059, 0079, 0225, 0227, 0252, 0256, 0294, 0305, 0338, owner decision R-25 and the ADR 0127
  2026-10-24 note)
- **New dependencies**: `@tanstack/query-core` 5.104.1 (MIT, no dependencies) through `catalog:`, the cache engine ADR
  0079 decision 1 names; it is in no catalog yet. The rest come through `workspace:*` (`@stackra/actions`, `config`,
  `container`, `contracts`, `devices`, `errors`, `platform`, `realtime`, `settings`, `storage`, `validation`), `zod`
  through `catalog:`,
  and `react` through `catalog:frontend` as an optional peer
- **Deploy modes**: same in all; the package calls no server itself (the generated client sends queued calls)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/state/query/README.md`, `packages/state/query/AGENTS.md`; ADR 0059, 0079, 0225, 0252, 0256 and 0338 are cited and amended only by a note if a decision here changes
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

### Session 2026-10-25 (wave 9, STA-488)

ADR 0338 accepts the queue mechanics of ADR 0252 and adds five rules. The client-side choices:

- ADR 0338 decision 1: the queue sends one call at a time in queue order (a conflict still holds only its aggregate);
  a call takes the device's next sequence when first sent and keeps it on a resend. The sequence is strictly
  increasing, not contiguous, as the pipeline's `DeviceSequenceStore` accepts
- ADR 0338 decision 5: a capped action is refused with `@stackra/actions`' own `OfflineCapReachedError`, so client and
  pipeline share one refusal; the queue's interim refusal of the same code is removed. Every waiting call counts
  whatever its age (the server counts it when it applies it), and so do the capped calls the server accepted within the
  window, kept with the queue. The amount is read from the cap's `amountField` (`amount` by default), the field the
  pipeline reads
- ADR 0338 decision 3: the cache lives in memory only; a query is available offline only as a declared replica
  (`ReplicaStore`), refreshed by an opaque cursor sent as the query's `cursor` input
- ADR 0338 decision 4: `OfflineLock` wipes on identity's revoke and past `QuerySettings.offlineLimitHours` (24) without
  a sync, and stays locked until someone signs in again. A wipe removes the last sync time too, so the countdown
  restarts and a failed sync right after the unlocking sign-in never wipes at once

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

### User Story 3 - See live updates (Priority: P2)

The dashboard refetches the KPI query when an `OrderPaid` refresh arrives.

**Independent Test**: `packages/state/query/src/core/services/__tests__/server-state-cache.service.test.ts`.

### User Story 4 - Test a screen that reads the queue (Priority: P2)

A test renders the offline banner with `fakeQueue({ pending: 2 })` and asserts the count.

**Independent Test**: `packages/state/query/src/testing/__tests__/queue.fake.test.ts`,
`packages/state/query/src/react/mutation-queue/__tests__/use-mutation-queue.test.tsx`.

### User Story 5 - Sell offline in order and within a cap (Priority: P1)

A till sells three times and redeems two gift cards offline. A third redemption is refused at once with
`offline_cap_reached`. When the network returns, the calls go out one at a time in the order they were made, each
with the till's device id and a rising sequence.

**Independent Test**: `packages/state/query/src/core/services/__tests__/mutation-queue.service.test.ts`.

### User Story 6 - Read recent sales offline with their age (Priority: P1)

A till opens "recent sales" with no network. `useReplica(RecentSalesQuery)` shows the last 30 days of its own legal
entity's sales, "as of" the last refresh; when the network returns, only the changes since the cursor are downloaded.

**Independent Test**: `packages/state/query/src/core/services/__tests__/replica-store.service.test.ts`,
`packages/state/query/src/react/replica/__tests__/use-replica.test.tsx`.

### User Story 7 - Wipe a lost till (Priority: P1)

A manager revokes a stolen tablet's session. The tablet wipes its queue, replicas and keys and locks until someone
signs in; a tablet that stays offline past the limit does the same on its own.

**Independent Test**: `packages/state/query/src/core/services/__tests__/offline-lock.service.test.ts`.

### Edge Cases

- A send that never reached the server (offline, `401`, `429`, `5xx`, a throw) keeps the call and stops its aggregate.
- A call older than its retention is not sent: it becomes a `stale_offline_mutation` conflict.
- A stored queue this version cannot read makes `open` reject and is left untouched; the queue stays closed.
- A failed persist on `enqueue` removes the call again: not durable means not queued.
- `client_retry` on an action that does not offer it is refused with a `RangeError`.
- A scope or user switch empties the cache and opens the other partition's queue, so nothing crosses principals.
- A call that did not reach the server stops the whole replay: no later call goes before it.
- A waiting capped call counts against its cap whatever its age; an accepted one stops counting once its window passes.
- A replica scoped by a dimension the device has no slice of keeps nothing; a record outside the slice is dropped even
  when the server sends it.
- A failed replica refresh keeps the replica and its "as of" time; a stored replica that cannot be read refills.
- A sync that fails right after the sign-in that unlocked a wiped device never wipes it again at once.

## Requirements

- **FR-001**: The package SHALL be `@stackra/query` at `packages/state/query`, `tier:lib`, with entries `.`,
  `./contracts`, `./react` and `./testing`.
- **FR-002**: It SHALL export every symbol the template imports from it: `.` `QueryConfig`, `QueryConfig$`,
  `QueryScope`, `offlineMap`; `./contracts` `QueryPersister`, `QueueLeader`; `./react` `ConflictRecord`(t),
  `PendingMutation`(t), `useMutationQueue`; `./testing` `fakeQueue`.
- **FR-003**: `QueryConfig` SHALL be a `Config({ schema })` class keyed `query` with safe defaults (keyed by principal
  and scope, replicas persisted only encrypted, replay on reconnect), and `QueryConfig$` its shipped schema.
- **FR-004**: The queue SHALL persist a call before `enqueue` resolves, give it an Idempotency-Key that every replay
  sends, and replay in queue order, only while this context leads and is online.
- **FR-005**: A refusal for good or an expired call SHALL become a conflict record holding the call and the server's
  record. It SHALL block later calls on its aggregate until it is resolved or discarded, and never be overwritten
  silently.
- **FR-006**: The cache SHALL be the TanStack Query client configured from `QueryConfig`, kept in memory only and
  emptied on every `open` and every wipe (as amended by ADR 0338 decision 3: offline reads are replicas).
- **FR-007**: A watched query SHALL be invalidated on each broadcast of an event its `invalidateOn` names, through
  `@stackra/realtime`'s connection.
- **FR-008**: No identifier, code or text SHALL use tenant vocabulary; partitions SHALL use the principal's public id
  and a contracts `ScopeRef`.
- **FR-009**: Every queued call SHALL carry its device's id and, from its first send, a per-device sequence it keeps on
  every resend; the queue SHALL never send a later call before an earlier one was accepted or refused.
- **FR-010**: An action with an offline cap SHALL be refused with the pipeline's `OfflineCapReachedError` once its
  waiting calls and its calls accepted within the window, with the new one, pass the cap's count or amount (read from
  `amountField`, `amount` by default); the accepted calls SHALL persist with the queue.
- **FR-011**: A query SHALL be available offline only when registered as a replica (`registerReplicas`, with a readable
  `window` and a positive integer `limit`); `ReplicaStore` SHALL fill it once, then merge the changes since the opaque
  cursor on open, reconnect and its refresh signal, keep it within `window` and `limit` and within the device's slice
  of its `scope`, persist it only through an encrypting persister while `persistEncrypted` is on, and `useReplica`
  SHALL return `{ data, asOf }`.
- **FR-012**: `OfflineLock` SHALL wipe the `outbox`, `cache` and `secrets` areas, after every store that holds offline
  data has closed, when the session is revoked or when `offlineLimitHours` pass without a sync (then also ending the
  session), and stay locked until someone signs in again or a sync succeeds.
- **FR-013**: The `storage` persister SHALL seal what it writes to the `outbox` and `cache` areas with
  `@stackra/storage`'s `PayloadSeal`, and read a value the seal cannot open as absent.

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
- `QueryOptions.maxParallelAggregates` is no longer read (per-device order sends one call at a time); it stays so the
  template's override parses, and goes with the template's next config sync.
- The local `OfflineCap` type stays until `@stackra/actions`' `OfflineCap` declares the `amountField` its pipeline reads
  (STA-489); then `OfflineEntry` inherits `cap` from `OfflineOptions`.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
