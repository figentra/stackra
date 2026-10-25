# Plan: `@stackra/query` wave 4

**Spec**: `.agents/specs/sta-348-query/spec.md`

## Design

- Four entries from stand-in barrels (STA-339 replaces them): `.` from `src/core/index.ts`, `./contracts` from
  `src/contracts/index.ts` (the leaf), `./react` and `./testing`. `src/config/` holds `QueryConfig`, exported from `.`.
- Ports in `src/contracts/ports/`: `QueryPersister` (`isEncrypted`, `read` and `write` by `StorageArea` and key),
  `QueueLeader` (a read-only `isLeader` signal) and `MutationSender` (`send(action, input, idempotencyKey)` resolving
  a `ReplayOutcome`). Each is an abstract class keyed `query.<Port>`. `DriverRegistry` augmentations name the drivers
  (`storage`; `broadcast_channel` and `memory`, which are the coordinator's).
- `MutationQueue` (service) holds an immutable state (`items`, `conflicts`, `isDraining`), persisted per partition in
  the `outbox` area as `{ version: 1, items, conflicts }`. Writes are serialised. `open` closes the queue until the
  partition's stored state is read and checked. `drain` is single-flight with a rerun flag. A pass groups items by
  aggregate, skips aggregates a conflict blocks, and runs at most `maxParallelAggregates` workers.
- `offlineMap` records the generated policies in a module registry (`OFFLINE_POLICIES`) that `enqueue` and `resolve`
  read. It returns `{ for(action | key) }`.
- `ServerStateCache` (service) owns a TanStack `QueryClient` with defaults from `QueryConfig`. `open(partition,
buster)` clears the client, restores a dehydrated snapshot from the `cache` area, and persists changes one second
  after they settle. `watch(query)` shares realtime subscriptions per query key and invalidates `[query.key]`.
- `useMutationQueue` resolves the queue from the container and subscribes on its `version`. `QueueFake` is a real
  queue over memory storage, the memory platform, an always-leading leader and a sender that never reaches a server.
  It is seeded synchronously through the protected `seed`.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                  |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/state/query`; imports only lib packages' public entries; no app, service or `encore.dev`                      |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                   |
| Security                              | PASS   | partitions keyed by the authenticated principal; the cache persists only through an encrypting persister while required (ADR 0059 d1) |
| HTTP and events                       | PASS   | replays keep the Idempotency-Key; no endpoint or event is declared; consumed events are read through realtime                         |
| Tenancy                               | PASS   | no tenant vocabulary (R-59); scope is a contracts `ScopeRef`; no tables                                                               |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests; a separate reviewer           |
| Not built yet (ADR 0227)              | PASS   | no sync engine; the offline path is a mutation queue with idempotency keys; TanStack Query is the cache ADR 0079 names                |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                             |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; `@tanstack/query-core` awaits its catalog pin from the dependency steward                          |
| Deploy modes (ADR 0076)               | PASS   | a client library, identical in SaaS, on-prem and air-gapped                                                                           |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                    |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                               |

- Boundaries: `./contracts` imports no other entry of this package; `testing` imports other packages' `.` only.
- Naming: one declaration per file; services and drivers per the sibling packages; `Precondition` vocabulary unused.

## Properties

- **P-001**: `package.json` names `@stackra/query` at `packages/state/query`, and `exports` lists exactly `.`, `./contracts`, `./react` and `./testing` — Validates: FR-001
- **P-002**: each barrel's export list equals its test's list, and every template import is in it (`QueryConfig`, `QueryConfig$`, `QueryScope`, `offlineMap`; `QueryPersister`, `QueueLeader`; `ConflictRecord`, `PendingMutation`, `useMutationQueue`; `fakeQueue`) — Validates: FR-002
- **P-003**: `{ ...new QueryOptions() }` equals `QUERY_CONFIG_SCHEMA.parse({})`, and `buildConfig(QueryConfig)` is keyed `query` with `scope: active_scope` and `persistEncrypted: true` — Validates: FR-003
- **P-004**: for any calls queued offline, once online and leading, the calls of each aggregate are sent in queue order, each with the id it was given as its Idempotency-Key, and at most `maxParallelAggregates` sends are in flight — Validates: FR-004
- **P-005**: for any refusal with a code, the call moves to `conflicts` with that code and the server record, and no later call of its aggregate is sent until that conflict is resolved or discarded — Validates: FR-005
- **P-006**: after `open(other)` the client holds no query of the previous partition; a snapshot is hydrated only when its buster matches and its age is below `persistMaxAgeHours`; with a plain persister and `persistEncrypted` on, nothing is written to the `cache` area — Validates: FR-006
- **P-007**: for a watched query, each broadcast of an event in its `invalidateOn` marks its results invalidated, and after the last watcher stops no broadcast does — Validates: FR-007
- **P-008**: no file under `packages/state/query/src` declares an identifier or enum code containing `tenant` — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                       |
| ---------- | --------------------------------------------------------------- |
| SaaS       | a client library, bundled into the web, desktop and mobile apps |
| On-prem    | identical: the same build, no SaaS-only code path               |
| Air-gapped | identical: needs no network beyond the install's own services   |
