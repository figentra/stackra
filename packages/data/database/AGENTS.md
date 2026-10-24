# AGENTS — @stackra/database

The MikroORM layer on Postgres. Member at `packages/data/database` (`tier:lib`), in the programming model v3.1 shape
(ADR 0294, 0305). Entries `.` and `./testing`; the old `./orm` is folded into `.` (ADR 0127 2026-10-24 note).

## Where code goes

| You are writing…                                     | It goes in…                                                           |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| A kind base (`CrudService`, `Migration`, `Macro`, …) | `src/core/bases/<name>.base.ts`                                       |
| The `Factory` base and the other test helpers        | `src/testing/{bases,constants,types}/`, `*.fixture.ts`                |
| A port or a driver                                   | `src/core/ports/<name>.port.ts`, `src/core/drivers/<name>.driver.ts`  |
| The migration compiler's recorders (internal)        | `src/core/records/<name>.record.ts`                                   |
| The ORM naming strategy                              | `src/core/orm/<name>.naming-strategy.ts`                              |
| A value class (`ColumnRef`, `MetricsReader`)         | `src/core/values/<name>.value.ts`                                     |
| An enum, a function, a constant, a type, a refusal   | `src/core/{enums,functions,constants,types,errors}/`                  |
| A test                                               | `__tests__/<name>.<kind>.test.ts` beside it; Docker tests take `.int` |

## Entries and barrels

- `src/core/index.ts` and `src/testing/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339);
  add every new public file to the barrel and to the export list in its `__tests__/index.test.ts`.

## This package

- The only package that imports `@mikro-orm/*` (ADR 0097). Re-export what consumers need (`EntitySchema`,
  `OptionalProps`, `UniqueViolation`) instead of letting them import the ORM.
- `Blueprint` is an interface so macros merge into it; never `implements Blueprint` on a class (a consumer's merged
  macros would break the typecheck of this package's source).
- No scope levels here: levels are deployment data (ADR 0327 d2). Scope hooks take the contracts `ScopeRef` (an id
  and an `ltree` path); `withScope` writes `app.scope_id`, `app.scope_path` and `app.scope_paths`, and
  `rowLevelSecurity(column, { setting, match })` generates the policy that reads one of them. Isolation stays in the
  database: never add an application WHERE filter (ADR 0327 d9, `.agents/rules/tenancy.md`).
- `t.scopeId()` and `t.scopePath()` are the only scope columns built in; tenancy's `belongsToTenant` and any other
  isolation macro live in their owning package.
- Migration rules the compiler enforces (explicit nullability and comments, expand-only adds, online indexes, approved
  extensions, stated raw inverses) change only with ADR 0159 or 0160.
- Raw SQL only through `sql` and the `$raw` filter, or in a subclass method with a `// raw-sql:` reason (ADR 0160).
- Faker and Testcontainers are imported by `./testing` only.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` and `#testing/*`
  aliases.
- No `enum`, no `#private` fields, no parameter properties (`erasableSyntaxOnly`), no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`, `format:check`, `clean` (package scripts).

## PII

| Data | Where | Handling                                                                                                        |
| ---- | ----- | --------------------------------------------------------------------------------------------------------------- |
| None | —     | Holds no rows of its own. The connection string is a secret the runtime hands to `connect`; it is never logged. |
