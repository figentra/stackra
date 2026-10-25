# Plan: `@stackra/outbox` wave 6

**Spec**: `.agents/specs/sta-348-outbox/spec.md`

## Design

- Three entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the leaf: the
  `OutboxDriver`, `InboxDriver` and `EventPublisher` ports, the `OutboxMessage`, `EventEnvelope`, `RowChange`,
  `ChangeConsumer` and `OutboxError` types, the `MessageKind` and `RowChangeKind` enums), `.` from `src/core/` with
  `src/config/`, `./node` from `src/node/`.
- `eventName(type)` gives the `registerEventNames` name, else the written name and version (registered on first use, so
  the same process's inbox finds the class). `eventMessage(record)` builds a due event message; the writer and the
  `EventOutbox` driver share it. `mintEventId` mints monotonic `evt_` ids, so one flush's messages keep their order.
- `OutboxWriterService` (a `DatabaseOptions.subscribers` entry): `onFlush` takes each changed entity's recorded events,
  keeps the integration events and records the others back, notes a change message for each watched row (key read at
  commit), keyed by the flushing entity manager; `beforeTransactionCommit` writes the noted messages with
  `insertMessages` on that entity manager; `afterTransactionRollback` drops them.
- `insertMessages` is one `insert … select from jsonb_to_recordset(?)` with the scope columns read from
  `current_setting('app.scope_id' | 'app.scope_path')`.
- `OutboxRelayService` is connected to a container (`connect`, as `EventBus.connect`); `relay()` runs one tick under
  `Locks.tryWith`: `due(now, 100)`, then per message publish (events) or hand to consumers in `withScope` (changes), then
  `remove`, `retry` at `now + backoffDelay(Exponential, attempt)` or `deadLetter` after ten attempts. `work` loops with
  a one-second pause when idle.
- `InboxService.receive` rebuilds the event (`X.create`) from its registered class, then in `withScope(scope ?? [])`
  claims the id and, on the first claim, `bus.deliver` + `bus.drain`. `InboxEventPublisherDriver` publishes into it.
- `PostgresOutboxDriver` and `PostgresInboxDriver` run one parameterised statement per method on `outbox.messages` and
  `outbox.inbox`, created by `CreateMessagesMigration` (with the `ltree` extension) and `CreateInboxMigration`.
- `OutboxConfig extends Config({ schema: OutboxOptions })`, with `OutboxConfig$` and the `DriverRegistry` entries of both
  stores beside it, as @stackra/queue has them.

## Constitution Check

| Law                                   | Result | Note                                                                                                       |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/runtime/outbox`; imports only `tier:lib` packages; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged; the Postgres drivers use the service's own connection                 |
| Security                              | PASS   | every value is a bound parameter; the actor comes from the running call, never from input                  |
| HTTP and events                       | PASS   | no endpoint; integration events leave only through the outbox; refusals are typed (`unknown_event`)        |
| Tenancy                               | PASS   | no tenant word declared; a scope is a `ScopeRef` from the transaction, opened per delivery (spec Impact)   |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests     |
| Not built yet (ADR 0227)              | PASS   | Postgres and memory only; no Kafka, NATS, Redpanda or change-data-capture tool                             |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                  |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                          |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                  |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                         |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0078 stands, the gaps are listed in the spec                 |

- Boundaries: runtime imports of actions, config, container, contracts, database, errors, events, locking, queue and
  validation; dev-only `@stackra/testing` and the tooling presets; no `@mikro-orm/*` (ADR 0097 d2).
- Versions: catalogs and `workspace:*` only.
- Naming: services `<Name>Service`, drivers `<Name>Driver`, the refusal ends in `Error`, the migrations
  `CreateMessagesMigration` and `CreateInboxMigration`, no `define` prefix, no "hook"; `MessageKind` and
  `RowChangeKind` are `Enum.of` values.

## Properties

- **P-001**: `package.json` names `@stackra/outbox` at `packages/runtime/outbox` and `exports` lists only `.`, `./contracts` and `./node` — Validates: FR-001
- **P-002**: for every flush, the integration events recorded by changed models are written once, in flush order, inside the committing transaction on its entity manager, other events stay recorded on their model, and a rollback writes nothing — Validates: FR-002
- **P-003**: for every tick under the lock, each due message is delivered once in order and is then deleted, retried at `now` plus its backoff, or dead-lettered at its tenth attempt; a tick without the lock delivers nothing — Validates: FR-003
- **P-004**: for every envelope delivered any number of times, its listeners run once, in its scope; an unknown wire name claims nothing — Validates: FR-004
- **P-005**: for every Postgres method, the SQL holds no value text and has as many placeholders as parameters; the scope columns read `app.scope_id` and `app.scope_path` — Validates: FR-005
- **P-006**: `EventOutbox.write` stores one message per integration event under its wire name and refuses a domain event — Validates: FR-006
- **P-007**: `buildConfig(OutboxConfig)` equals `OutboxConfig$.parse({})` with driver `postgres`, `memory` builds, and another name refuses — Validates: FR-007
- **P-008**: `grep -rE "(const|let|class|interface|type|function) [A-Za-z]*[Tt]enant" packages/runtime/outbox/src` and `grep -r "@mikro-orm" packages/runtime/outbox/src` find nothing — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------- |
| SaaS       | the same build; events cross services through the Encore Pub/Sub publisher driver gen supplies     |
| On-prem    | identical: the same build; the in-process publisher, or a Postgres queue transport, with no broker |
| Air-gapped | identical: needs no network; Postgres holds the outbox and the inbox in the deployment itself      |
