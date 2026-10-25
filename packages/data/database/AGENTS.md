# AGENTS — @stackra/database

The MikroORM layer on Postgres. Member at `packages/data/database` (`tier:lib`), in the programming model v3.1 shape
(ADR 0294, 0305). Entries `.`, `./contracts`, `./node` and `./testing`; the old `./orm` is folded into `.` (ADR 0127 2026-10-24 note).
`src/node/` holds the two drivers (the `./node` entry) and this package's migrations, found by path and exported from no entry.

## Where code goes

| You are writing…                                                     | It goes in…                                                                   |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A kind base (`CrudService`, `Migration`, `Macro`, …)                 | `src/core/bases/<name>.base.ts`                                               |
| The `Factory` base and the other test helpers                        | `src/testing/{bases,constants,types}/`, `*.fixture.ts`                        |
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
- Legal holds (ADR 0134, 2026-10-24 amendment): every disposal path asks the connected `HoldRegistry` through
  `disposableIds`: `HoldSubscriber` for unit-of-work deletes, `CrudService.purge` for bulk deletes, and retention jobs
  directly. A new bulk delete path calls it too; never decide or lift a hold here (the compliance service does).
- Collations: `schema.createCollation(name, locale)` creates an ICU collation in the module schema and
  `.collate(name)` names it on a text column; the locale is the migration's literal, never chosen in this package.
- `t.scopeId()` and `t.scopePath()` are the only scope columns built in; tenancy's `belongsToTenant` and any other
  isolation macro live in their owning package.
- Migration rules the compiler enforces (explicit nullability and comments, expand-only adds, online indexes, approved
  extensions, stated raw inverses) change only with ADR 0159 or 0160.
- Raw SQL only through `sql` and the `$raw` filter, or in a subclass method with a `// raw-sql:` reason (ADR 0160).
- Faker and Testcontainers are imported by `./testing` only.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*`, `#node/*` and
  `#testing/*` aliases; `src/core/` never imports `#node/*` (only tests do).
- No `enum`, no `#private` fields, no parameter properties (`erasableSyntaxOnly`), no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`, `format:check`, `clean` (package scripts).

## PII

| Data         | Where                             | Handling                                                                                               |
| ------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| None         | —                                 | The connection string is a secret the runtime hands to `connect`; it is never logged.                  |
| Device ids   | `database.sequence_blocks.holder` | Pseudonymous: a device's public id, never a person's. Kept with the block for the audit of the series. |
| Void reasons | `database.sequence_voids.reason`  | Operator text for the audit; callers never put personal data in it.                                    |
