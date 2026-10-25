# AGENTS — @stackra/outbox

The transactional outbox: the ORM flush writer, the relay, inbox deduplication, the `OutboxDriver`, `InboxDriver` and
`EventPublisher` ports with memory and Postgres drivers, the `EventOutbox` driver and the change-consumer seam (ADR
0078 decision 4, ADR 0141, ADR 0221 decision 5). Member at `packages/runtime/outbox` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./node`.

## Where code goes

| You are writing…                            | It goes in…                                               |
| ------------------------------------------- | --------------------------------------------------------- |
| The configuration (`OutboxConfig`)          | `src/config/outbox.config.ts`                             |
| Its options shape                           | `src/core/schemas/outbox-options.schema.ts`               |
| Its shipped zod schema (`OutboxConfig$`)    | `src/core/constants/outbox-config-schema.constant.ts`     |
| A port, a stored type or its enum           | `src/contracts/{ports,types,enums}/`                      |
| An isomorphic driver, refusal or registry   | `src/core/{drivers,errors,functions,constants}/`          |
| The writer, relay, inbox or a server driver | `src/node/{services,drivers}/`                            |
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
- A driver stores and lists; it never delivers, computes a backoff or reads a clock. The relay passes `now` and the
  retry time.
- One relay runs a tick at a time (`Locks.tryWith`), so `due` reserves nothing. Every delivery that opens a scope runs
  in `withScope(scope ?? [])`: with the Postgres lock driver a tick is one transaction, and a scope set for one message
  must not reach the next.
- Raw SQL only in the Postgres drivers and `insertMessages`, every value bound, every row read through zod, each
  statement with a `// raw-sql:` reason (ADR 0160). A released migration is frozen; a change is a new migration.
- The offline stores bind the device id, the partition and the caller's scope path in every statement; their tables
  carry no row-level security. A replica append takes the partition's advisory lock before it reads the head.
- No tenant word is declared here (final review R-59, ADR 0323): a scope is a `ScopeRef`. "Hook" is a React word only
  (ADR 0294 decision 23): the row-change seam is a change consumer.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70); ADR 0182 asks 90/80 of the outbox, which the
  shared preset does not enforce yet.

## PII

| Data          | Where                                                 | Handling                                                                                         |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Event payload | `outbox.messages.data` (jsonb), memory store          | The integration event's fields as its author declared them; deleted once delivered, never logged |
| Actor         | `outbox.messages.meta` (jsonb), the envelope's `meta` | Public ids and kinds of the caller, for consumers' audit and `onBehalfOf`                        |
| Row change    | `outbox.messages.data` (jsonb)                        | Model name, row key and field names only; never the values                                       |
| Last error    | `outbox.messages.last_error` (jsonb)                  | The error's code and message; the relay adds no payload and no stack                             |
| Event ids     | `outbox.inbox.event_id`                               | Opaque ids, pruned by the retention purge                                                        |
