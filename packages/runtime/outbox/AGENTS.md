# AGENTS — @stackra/outbox

The transactional outbox: the ORM flush writer, the relay, inbox deduplication, the `OutboxDriver`, `InboxDriver`,
`ChangeFeed` and `EventPublisher` ports with memory and Postgres drivers, the `EventOutbox` driver and the retained
change feed with its change consumers (ADR 0078 decision 4, ADR 0141, ADR 0221 decision 5, both amended 2026-10-28), and
the cross-app event relay: fan-out, signed delivery and the verified inbox (ADR 0511 decisions 11 to 19, STA-1910). Member at `packages/runtime/outbox` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./node`.

## Where code goes

| You are writing…                            | It goes in…                                               |
| ------------------------------------------- | --------------------------------------------------------- |
| The configuration (`OutboxConfig`)          | `src/config/outbox.config.ts`                             |
| The cross-app relay's and inbox's configs   | `src/config/{events-relay,relay-inbox}.config.ts`         |
| Its options shape                           | `src/core/schemas/outbox-options.schema.ts`               |
| Its shipped zod schema (`OutboxConfig$`)    | `src/core/constants/outbox-config-schema.constant.ts`     |
| A port, a stored type or its enum           | `src/contracts/{ports,types,enums}/`                      |
| An isomorphic driver, refusal or registry   | `src/core/{drivers,errors,functions,constants}/`          |
| The writer, relay, inbox or a server driver | `src/node/{services,drivers}/`                            |
| A job (action)                              | never here: `@stackra/data-maintenance` (ADR 0462)        |
| A facet (`@ConsumesChanges`)                | `src/core/decorators/`                                    |
| A migration                                 | `src/node/database/migrations/<NNNN>-<name>.migration.ts` |
| A test                                      | `__tests__/<name>.<kind>.test.ts` beside it               |

## Entries and barrels

- `src/{core,contracts,node}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports it, `node` imports `core`. Nothing in `.` touches a database.
- `OutboxConfig$` mirrors `OutboxOptions` by hand until gen compiles this package's schemas; change both together.
- `OUTBOX_DRIVERS` names each store driver by its file prefix; one `outbox.driver` value picks both stores.

## This package

- Never import `@mikro-orm/*` (ADR 0097 decision 2): the writer's ORM arguments are structural types in
  `src/node/types/`, and the entity manager type is `ReturnType<Database["em"]>`.
- The writer takes integration events only; any other recorded event goes back on its model in order. It writes at
  `beforeTransactionCommit` (savepoints included) on the entity manager of that event, never on `Database.em()`, so an
  implicit flush transaction is joined too.
- The inbox hands every claimed envelope to the relays `registerRelays` named and `connect` resolved, before the bus
  runs the typed listeners; without a relay an unknown wire name is still refused before the claim (ADR 0260
  decision 4). A relay is never keyed by wire name. The generated boot calls `connect` and, on shutdown, `disconnect`.
- Event versions go through `@stackra/versioning` only (`publishedVersions`, `downgrade`, `upgrade`): the relay
  publishes every live older version under the same event id, and the inbox lifts an older one and leaves a newer one
  unclaimed. Never mint a second id for another version, and never convert a payload by hand here.
- A driver stores and lists; it never delivers, computes a backoff or reads a clock. The relay passes `now` and the
  retry time.
- `holding(value)` and `rewrite(id, data)` exist for erasure only (`redactSubjectMessages`, called by
  @stackra/privacy's saga): `holding` matches a string value at any payload depth, never a key; `rewrite` replaces
  the payload and keeps the delivery state. Never import @stackra/privacy here (privacy depends on outbox).
- `pruneOutbox` is the one prune path (the job of @stackra/data-maintenance calls it, and outbox never depends on
  that add-on). It claims dead letters only (`claimDead`) and deletes each in its owner; never prune a live (due or retrying) message. The inbox prune window
  (`pruneAfterDays`) must outlast every producer's retries, or a late redelivery runs twice.
- The batch window (`outbox.batchWindowSeconds`) is the relay's only setting; the rest of `OUTBOX_DEFAULTS` is fixed.
  A held tick returns `0`, so `work` pauses the poll interval and checks again.
- Row changes go to the change log (`outbox.changes`), never to `outbox.messages`: they are kept after delivery and
  read per consumer from its cursor. Never delete a change on delivery; retention drops whole partitions
  (`maintainChangeLog`, run daily by `data_maintenance.change_log.maintain`). `ChangeFeed.claim` lists only entries
  older than the snapshot's `xmin` (a cursor must never pass a change that commits late). A failing consumer stalls itself only; it never dead-letters a change.
- Change values are opt-in (`CapturesChanges({ values: true })`) and go through `changeCaptureOf`, which drops
  encrypted, `@Classified` and excluded fields. Never put a value in a change any other way.
- One relay runs a tick at a time (`Locks.tryWith`), so `claim` reserves nothing. Every delivery runs in the bound
  `CallIsolation` as the actor stored with it (none stored: a platform actor, no tenant row; ADR 0495), else in
  `withScope(scope ?? [])`, each in a transaction of its own (`requiresNew`); the inbox takes the port, a `ScopeOwnership` and the logger from `connect` and downgrades an actor its scope does not own, and a run of changes splits where the actor changes: with the Postgres lock driver a tick is one transaction, and a scope set for one message
  must not reach the next.
- Raw SQL only in the Postgres drivers, `insertMessages` and `insertChanges`, every value bound, every row read through zod, each
  statement with a `// raw-sql:` reason (ADR 0160). A released migration is frozen; a change is a new migration.
- The offline stores bind the device id, the partition and the caller's scope path in every statement, under the
  platform form's row security. A replica append takes the partition's advisory lock before it reads the head, and
  reads it through `outbox.replica_bounds` (positions are global across owners; rows stay each owner's).
- Row security (`outbox.0006`, ADR 0239 amendment, gaps A and C): `messages`, `deliveries`, `changes` (every partition),
  `replica_changes`, `device_sequences` and `offline_cap_uses` are tenant-owned in the platform form; `tenant_id` is
  filled from `app.tenant_id` by its default and never written here. A cross-owner read is a claim through a
  `schema.systemFunction` (ids, owner, order or lease columns only, never a payload); the payload is loaded and every
  outcome or delete recorded in the row's owner (`inRowOwner`, `loadChanges`). A claimed row that does not load, or an
  owned row with no `CallIsolation` bound, throws (`ClaimNotLoadedError`, `RowIsolationMissingError`): never skip
  one. A class built by injection reads the isolation optionally (`boundIsolation` of the injected `Container`), so an
  app without tenancy still boots. `inRowOwner` (as `OUTBOX_ACTOR_ID`), `boundIsolation` and both refusals are
  @stackra/actions'; `.` re-exports the last three for one release only. Policies are not inherited by partitions: every partition `maintain` makes is
  secured by `outbox.secure_change_partition` at once. The system-access role never deletes.
- A platform message or change (written with no tenant) is one no tenant's erasure can rewrite: a platform writer
  never puts personal data in one.
- No tenant word is declared here (final review R-59, ADR 0323): a scope is a `ScopeRef`, a row's tenant its `ownerId`. "Hook" is a React word only
  (ADR 0294 decision 23): the row-change seam is a change consumer.
- Never mint an id here: message ids come from `@stackra/contracts`' `mintPublicId("evt", time)`. Never narrow the
  `evt_` check to one body form; stored ids of the older forms must keep passing (STA-1380).
- Cross-app delivery (ADR 0511 d11-19): the fan-out runs only when the container binds `CrossAppFanOut`, so a service
  with no relay configuration relays exactly as before; a fan-out failure fails the outbox message, and
  `outbox.deliveries`' unique (event id, subscriber, type) keeps a retry single. `CrossAppRelayService` holds its own lock
  (`outbox.cross-app`) only to lease deliveries (`DeliveryDriver.lease`); it never sends HTTP inside the lock or a
  transaction, and records each outcome in its own write. It reuses `OUTBOX_DEFAULTS`' attempts, backoff and poll. The
  inbox answers 403 to an event its verified producer does not publish (`RelayInboxConfig.producers[s].events`). Never send `producer`: the
  inbox sets it from the verified sender. Never parse an inbox body before `InboxVerifier.verify`, never log a body,
  and never import @stackra/webhooks (the signature layout is copied, research R-4). The signing key's value is read
  only through the `SecretStore` port by its name; it is never logged or kept as text. `EventsRelayConfig`
  (subscribers, keys) and `RelayInboxConfig`'s producer key table are values gen emits at build time, never runtime
  env vars.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70); ADR 0182 asks 90/80 of the outbox, which the
  shared preset does not enforce yet.

## PII

| Data          | Where                                                 | Handling                                                                                                                                                             |
| ------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event payload | `outbox.messages.data` (jsonb), memory store          | The integration event's fields as its author declared them; deleted once delivered, never logged; none in a platform (no tenant) message, which erasure cannot rewrite |
| Actor         | `outbox.messages.meta` (jsonb), the envelope's `meta` | Public ids and kinds of the caller, for consumers' audit and `onBehalfOf`                                                                                            |
| Row change    | `outbox.changes.data` (jsonb)                         | Model name, row key, field names; values only when the model opts in, never encrypted or `@Classified` ones; kept `changeRetentionDays`, dropped by whole partitions |
| Delivery      | `outbox.deliveries.envelope` (jsonb)                  | The cross-app envelope as sent; deleted once delivered, never logged; `last_error` keeps a code and HTTP status only                                                 |
| Last error    | `outbox.messages.last_error` (jsonb)                  | The error's code and message; the relay adds no payload and no stack                                                                                                 |
| Event ids     | `outbox.inbox.event_id`                               | Opaque ids, pruned by the retention purge                                                                                                                            |
