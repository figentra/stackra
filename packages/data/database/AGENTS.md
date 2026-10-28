<!-- Purpose: agent guide of @stackra/database: where code goes, entries, the package rules (migrations and column changes, scope columns, raw SQL, sequences, projections). Boundary: packages/data/database only. Runtime: none (Markdown). Governing contract: ADR 0097; ADR 0159; ADR 0160; ADR 0294; ADR 0305; STA-918. -->

# AGENTS — @stackra/database

The MikroORM layer on Postgres. Member at `packages/data/database` (`tier:lib`), in the programming model v3.1 shape
(ADR 0294, 0305). Entries `.`, `./contracts`, `./node` and `./testing`; the old `./orm` is folded into `.` (ADR 0127 2026-10-24 note).
`src/node/` holds the two drivers (the `./node` entry) and this package's migrations, found by path and exported from no entry.

## Where code goes

| You are writing…                                                     | It goes in…                                                                   |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A kind base (`CrudService`, `Migration`, `Macro`, …)                 | `src/core/bases/<name>.base.ts`                                               |
| The `Factory` base and the other test helpers                        | `src/testing/{bases,constants,types}/`, `use-postgres.ts`                     |
| The `memory` driver of `Database` (PGlite, unit tier only)           | `src/testing/drivers/memory-database.driver.ts`                               |
| A port (`Database`, which carries `Database.current()`)              | `src/core/ports/<name>.port.ts`                                               |
| A port or type with no core dependency (`VisibilityFilter`, `Where`) | `src/contracts/{ports,types}/`                                                |
| A driver (Postgres, unit of work)                                    | `src/node/drivers/<name>.driver.ts`                                           |
| The migration compiler's recorders (internal)                        | `src/core/records/<name>.record.ts`                                           |
| The ORM naming strategy                                              | `src/core/orm/<name>.naming-strategy.ts`                                      |
| A value class (`ColumnRef`, `MetricsReader`)                         | `src/core/values/<name>.value.ts`                                             |
| An enum, a function, a constant, a type, a refusal                   | `src/core/{enums,functions,constants,types,errors}/`                          |
| A migration of this package's own tables                             | `src/node/database/migrations/<NNNN>-<stem>.migration.ts` (schema `database`) |
| A test                                                               | `__tests__/<name>.<kind>.test.ts` beside it; Docker tests take `.int`         |

## Entries and barrels

- `src/core/index.ts`, `src/contracts/index.ts`, `src/node/index.ts` and `src/testing/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339);
  add every new public file to the barrel and to the export list in its `__tests__/index.test.ts`.

## This package

- The only package that imports `@mikro-orm/*` (ADR 0097). Re-export what consumers need (`EntitySchema`,
  `OptionalProps`, `UniqueViolation`) instead of letting them import the ORM.
- `Blueprint` is an interface so macros merge into it; never `implements Blueprint` on a class (a consumer's merged
  macros would break the typecheck of this package's source).
- No scope levels here: levels are deployment data (ADR 0327 d2). Scope hooks take the contracts `ScopeRef` (an id
  and an `ltree` path); `withScope` writes `app.scope_id`, `app.scope_path` and `app.scope_paths`, and
  `rowLevelSecurity(column, { setting, match })` generates the policy that reads one of them. Isolation stays in the
  database: never add an application WHERE filter for isolation (ADR 0327 d9, `.agents/rules/tenancy.md`).
- Record visibility is the one application filter, and it only narrows inside isolation (ADR 0333 d4–d5): every read
  of `CrudService`, `GraphQuery` and `MetricsReader` takes its filter from the internal `visibleFilter`, which ANDs
  the bound `VisibilityFilter` driver's conditions. A new read path calls it too; never let it widen, bypass or carry
  scope isolation, and never decide visibility here (the model's facet and iam's evaluation do).
- Sequences (ADR 0342): `SequenceService` is the only writer of `database.sequence_counters`, `sequence_blocks` and
  `sequence_voids`. Every change to a series locks its counter row first (a block row is locked before the counter in
  `release`, and nothing that holds a counter lock waits on a held block), so keep that order. `next` and `claim` run
  only inside the caller's transaction. A module never writes its own counter table; a series the primitive cannot
  express extends it here, with an ADR. No Postgres `SEQUENCE` for a document number.
- Read models (ADR 0163 d1, ADR 0294 d16): `Projection` is the only writer of `database.projection_rows`. A write
  locks the record's current version, skips one as old as it, closes it and inserts the next; never update a stored
  version in place, so `asOf` reads stay true. Which events feed a projection is its listeners', never an option.
- Legal holds (ADR 0134, 2026-10-24 amendment): every disposal path asks the connected `HoldRegistry` through
  `disposableIds`: `HoldSubscriber` for unit-of-work deletes, `CrudService.purge` for bulk deletes, and retention jobs
  directly. A new bulk delete path calls it too; never decide or lift a hold here (the compliance service does).
  Subject links come only from `registerHoldLinks` and travel as `HoldLinks`; an edit a hold freezes asks with
  `Disposal.Edit`; `ServiceHoldRegistryDriver` reaches the holds service only through `HoldChannel` (STA-1241).
- The yearly period's time zone is the series owner's setting, through the connected `SequenceTimeZone` (ADR 0394);
  never add a time zone constant or read a setting here.
- The Postgres action stores (`database.idempotency_keys`, `database.rate_limit_buckets`) and the seed ledger
  (`database.seed_records`) are this package's own tables, written only by their drivers and the seed runner (ADR 0396).
  No row-level security on them: an action-store key is already scoped, and product defaults are not tenant-owned.
- The migration runner (`migrate`, `rollback`) is the only writer of `schema_migrations` and
  `schema_migrations_history`. Keep `schema_migrations` in golang-migrate's `(version, dirty)` shape (Encore reads it);
  anything more goes in the history table. Every run holds the runner's advisory lock for its whole session.
- Stamps (ADR 0133 d7): `StampSubscriber` and `stampFields` are the only writers of `createdBy`/`updatedBy`, and the
  actor is the running call's, never input. A new native update path (`nativeUpdate`, a query-builder update) spreads
  `stampFields(model, "update")` into its data, as `increment` and `repath` do.
- Delete policies (ADR 0134 d4): `deleteFilters` registers the `deleted` and `archived` filters in both drivers'
  `connect` (keep them the same); `CrudService.delete` picks the policy from the model's traits. A new bulk read that
  must see kept rows turns the filter off by name (`filters: { deleted: false }`), never by dropping all filters.
- Partitions: `maintainPartitions` is the only code that creates, detaches or drops a partition, and it asks the
  `HoldRegistry` before dropping one. Never drop `<table>_default`, and never convert an existing table in a migration.
- Database errors become refusals only at the action boundary (`DatabaseUnitOfWorkDriver` through
  `translateDbError`); `CrudService` leaves them as the driver raised them, because callers catch `UniqueViolation`.
  A refusal carries the constraint name, never a row value.
- Collations: `schema.createCollation(name, locale)` creates an ICU collation in the module schema and
  `.collate(name)` names it on a text column; the locale is the migration's literal, never chosen in this package.
- `t.scopeId()` and `t.scopePath()` are the only scope columns built in; tenancy's `belongsToTenant` and any other
  isolation macro live in their owning package.
- Migration rules the compiler enforces (explicit nullability and comments, expand-only adds, online indexes, approved
  extensions, stated raw inverses) change only with ADR 0159 or 0160.
- Column changes (`t.change(column)`, `ColumnChangeRecord`): existing tables only, every value a literal, a type change
  states its `from` so the inverse needs no database read. Never read the live schema to fill a change in.
- Raw SQL only through `sql` and the `$raw` filter, or in a subclass method with a `// raw-sql:` reason (ADR 0160).
- A filter operator MikroORM has no typed form for (jsonb contains or path, `ltree` ancestor or descendant) is a
  function returning a parameterised fragment for `$raw` (`jsonContains`, `jsonPath`, `ancestorOf`, `descendantOf`);
  never widen `Where` with a custom `$` key, and never use one for isolation.
- A table read's filter values pass through `filterCondition` only: the closed `TableFilter` vocabulary (value, list,
  range, dateRange, comparison, contains, isNull). Never pass a caller's object to the ORM as a condition; add an
  operator there instead. A sort takes three keys at most, the primary key always last.
- A counter is `increment(where, field, by)` (one `col = col + ?` statement), never read-modify-write; a single-flight
  step (token refresh) is `lock(where)` inside a transaction, then a re-check of what it reads (STA-1239).
- Replica reads go only through `Database.onReplica`, which replays the running `app.*` settings in a read-only replica
  transaction; MikroORM's `preferReadReplicas` stays off, because a read outside that transaction carries no scope.
- Faker, Testcontainers, `@electric-sql/pglite` and `@mikro-orm/pglite` are imported by `./testing` only.
- The unit tier's database is `MemoryDatabaseDriver` (PGlite, ADR 0266 memory first), connected by
  `DATABASE_TESTING_PLUGIN` on every compile unless another database is connected; keep its `transaction`, `withScope`
  and `em` the same as `PostgresDatabaseDriver`'s when either changes.
- `DatabaseHealthIndicatorDriver` is the `HealthIndicator` driver: it runs `select 1`, bounded by `health.timeout`; `health.critical: false` reports `degraded` instead of `down`. It reports the error's name, never its message.
- `assertRowSecurity` (`./testing`, stackra-258) is owner-agnostic: it takes the column, setting, role and probe
  values and names no tenant; `@stackra/tenancy/testing` supplies the tenant form. Its probe always rolls back.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*`, `#node/*` and
  `#testing/*` aliases; `src/core/` never imports `#node/*` (only tests do).
- No `enum`, no `#private` fields, no parameter properties (`erasableSyntaxOnly`), no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`, `format:check`, `clean` (package scripts).

## PII

| Data           | Where                             | Handling                                                                                               |
| -------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| None           | —                                 | The connection string is a secret the runtime hands to `connect`; it is never logged.                  |
| Device ids     | `database.sequence_blocks.holder` | Pseudonymous: a device's public id, never a person's. Kept with the block for the audit of the series. |
| Void reasons   | `database.sequence_voids.reason`  | Operator text for the audit; callers never put personal data in it.                                    |
| Projected rows | `database.projection_rows.data`   | Whatever the projection owner stores from the source's events; that owner declares and minimises it.   |
