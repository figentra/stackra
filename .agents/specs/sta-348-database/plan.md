# Plan: `@stackra/database` wave 4

**Spec**: `.agents/specs/sta-348-database/spec.md`

## Design

- Two entries: `.` from `src/core/` and `./testing` from `src/testing/`, through stand-in barrels (STA-339 replaces
  them). `EntitySchema`, `OptionalProps` and `UniqueViolation` (MikroORM's `UniqueConstraintViolationException`) are
  re-exported, so consumers never import the ORM.
- Runtime: the `Database` port (`em`, `transaction`, `withScope`, `close`, static `current()`) and
  `PostgresDatabaseDriver` (MikroORM 7 on Postgres, `StackraNamingStrategy`, `inferDefaultValues: false`, no global
  context). `em()` returns the transaction's or request's entity manager, else a fork; `withScope` runs
  `set_config` of `app.scope_id`, `app.scope_path` and `app.scope_paths` in the transaction. `DatabaseUnitOfWorkDriver` implements the actions
  `UnitOfWork`.
- `CrudService<M>` extends container's `Service`; its model comes from `registerModelPartners` (gen reads the type
  argument). `table` uses `findByCursor` with the sort key then the primary key; `metrics` returns a `MetricsReader`
  over the query builder with FILTER clauses for both periods and daily buckets. `repositoryOf(Model)` makes one
  `CrudService` subclass token per model.
- Migrations: `Migration` (both forms, `after` checked), `Macro`, `Seeder` kind bases. `compileMigration` runs `up()`
  against `SchemaRecord`/`BlueprintRecord` recorders and emits one transactional step, then one step per online
  statement, each with its derived inverse. `Blueprint` is an interface so gen-written macro types merge into it; the
  recorder installs each macro under its derived name.
- `sql` builds a parameterised MikroORM raw fragment, writing `table(...)` column refs as quoted names.
- `./testing`: `Factory<M>` (new, count, state, sequence, for, has, make, create) over a Faker with `publicId`;
  `usePostgres()` starts a Testcontainers Postgres per file and applies compiled migrations; a testing-module plugin
  adds `.seed(...)` and `app.transaction(...)`.
- Sequences (wave 9, ADR 0342): `Sequence` is a called-only `createKind` base whose reader normalises and checks the
  options (reusing `formatSequenceNumber` to refuse unknown tokens). `registerSequences` fills an internal registry
  with gen's locked keys. `SequenceService(Database, Clock)` runs parameterised raw SQL on the context's entity
  manager over three tables in the `database` schema, compiled from `src/node/database/migrations/0001-…`: a counter
  row per (key, scope, series JSON, period) taken by `insert … on conflict do update` (which locks it until commit),
  then the lowest returned remainder (`holder is null` rows of `sequence_blocks`), else `last_number + size`. Blocks
  record holder, range and `issued_through`; `claim` moves `issued_through` and voids the skipped range; `release`
  steps the counter back over a tail block or inserts an unheld remainder; `void` inserts the remainder into
  `sequence_voids`. Lock order: counter before pool rows; a held block before the counter (only in `release`).
- Visibility (wave 9, ADR 0333 d4): the `VisibilityFilter` port and `connectVisibilityFilter(resolver)` (the
  `connectExtensions` precedent, since `CrudService` subclasses inject nothing). The internal `visibleFilter(model,
where)` reads the driver and `ContextStorage`'s current call from the connected resolver and returns `{ $and:
[where, conditions] }`, or `where` alone when unbound or empty. `CrudService` reads, `GraphQuery.through` and
  `MetricsReader` (a filter thunk) all take their filter from it.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/data/database`; workspace imports `@stackra/{actions,container,contracts,errors,model}` (packages only); no app, service or `encore.dev`                                                                                               |
| Secrets (ADR 0173)                    | PASS   | the connection string is passed in by the runtime and never read from a file or logged                                                                                                                                                                         |
| Security                              | PASS   | raw SQL only parameterised through `sql`; identifiers checked as snake_case before they enter SQL                                                                                                                                                              |
| HTTP and events                       | PASS   | generated operations are real actions and queries through @stackra/actions; no endpoint is hand-written                                                                                                                                                        |
| Tenancy                               | PASS   | both isolation layers are hooks (`withScope`, `rowLevelSecurity`) proven by an integration test; the sequence tables carry the scope columns and the forced ancestor policy, with an isolation test; the visibility seam only narrows; no scope level is named |
| Delegation                            | PASS   | `data-engineer` (route `package`) writes the code and tests; `security-tenancy-reviewer` and `code-reviewer` review                                                                                                                                            |
| Not built yet (ADR 0227)              | PASS   | MikroORM only; no Prisma, Drizzle, TypeORM or Knex; no ORM on a client                                                                                                                                                                                         |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject; Docker tests take `.int`                                                                                                                                                                            |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                                                              |
| Deploy modes (ADR 0076)               | PASS   | identical in SaaS, on-prem and air-gapped                                                                                                                                                                                                                      |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                                                             |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand                                                                                                                                                                                                 |

- Boundaries: imports `@mikro-orm/core`, `@mikro-orm/postgresql` and five workspace packages; Faker and Testcontainers
  only from `./testing`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; kind bases `PascalCase(kind)`; migration recorders `<name>.record.ts`.

## Properties

- **P-001**: `package.json` names `@stackra/database` at `packages/data/database` and `exports` lists only `.` and `./testing` — Validates: FR-001
- **P-002**: `.` and `./testing` export every symbol the template imports, and nothing internal (`BlueprintRecord`, `SchemaRecord`, `ACTIVE_DATABASE`, `modelOf`, `FAKER`) — Validates: FR-002
- **P-003**: a `CrudService` subclass reads and writes through `Database.current().em()` with its registered model, and an unregistered one is named in a `TypeError` — Validates: FR-003
- **P-004**: for every migration whose blueprint omits a column's nullability or comment, `compileMigration` throws, and every index on an existing table compiles to a single-statement non-transactional step — Validates: FR-004
- **P-005**: every index the compiler or the naming strategy names starts with `idx_`, every foreign key with `fk_`, every check with `ck_` — Validates: FR-005
- **P-006**: `withScope` and `rowLevelSecurity` share the settings `app.scope_id`, `app.scope_path` and `app.scope_paths`, and no source file names a scope level — Validates: FR-006
- **P-007**: only `src/testing/` imports `@faker-js/faker` and `@testcontainers/postgresql` — Validates: FR-007
- **P-008**: for every option set `Sequence` accepts, `kindOf` returns it with the defaults filled in, and every set with a bad key, dimension, token, reset or size, or `{year}` without `reset: "yearly"` (or the reverse), throws; `formatSequenceNumber(f, n, y)` writes `n` padded to the token's width and refuses unknown tokens — Validates: FR-008
- **P-009**: for N concurrent committed `next` calls on one series the numbers are exactly the next N integers, and a rolled-back call leaves the next number unchanged; `next` outside a transaction throws — Validates: FR-009
- **P-010**: for every reserved block, each number from `first` to `last` ends as exactly one of a claimed document number, a voided number with a reason, or a number handed out again after `release` — Validates: FR-010
- **P-011**: the compiled migration creates the three tables in `database` with `scope_id`, `scope_path` and a forced `pol_<table>_scope_path` policy each, and no `create sequence` — Validates: FR-011
- **P-012**: with a `VisibilityFilter` bound, every `CrudService` read, `GraphQuery.through` and `MetricsReader` statement filters by `{ $and: [where, conditions] }`; unbound or with `{}` conditions the filter equals `filterOf(where)` — Validates: FR-012

## Deploy modes

| Mode       | Behaviour                                                     |
| ---------- | ------------------------------------------------------------- |
| SaaS       | a library inside each service; connects to its own Postgres   |
| On-prem    | identical: the same build, no SaaS-only code path             |
| Air-gapped | identical: needs no network beyond the service's own database |
