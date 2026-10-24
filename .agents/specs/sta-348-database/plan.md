# Plan: `@stackra/database` wave 4

**Spec**: `.agents/specs/sta-348-database/spec.md`

## Design

- Two entries: `.` from `src/core/` and `./testing` from `src/testing/`, through stand-in barrels (STA-339 replaces
  them). `EntitySchema`, `OptionalProps` and `UniqueViolation` (MikroORM's `UniqueConstraintViolationException`) are
  re-exported, so consumers never import the ORM.
- Runtime: the `Database` port (`em`, `transaction`, `withScope`, `close`, static `current()`) and
  `PostgresDatabaseDriver` (MikroORM 7 on Postgres, `StackraNamingStrategy`, `inferDefaultValues: false`, no global
  context). `em()` returns the transaction's or request's entity manager, else a fork; `withScope` runs
  `set_config('app.<level>_id', id, true)` in the transaction. `DatabaseUnitOfWorkDriver` implements the actions
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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                             |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/data/database`; workspace imports `@stackra/{actions,container,contracts,errors,model}` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | the connection string is passed in by the runtime and never read from a file or logged                                                                           |
| Security                              | PASS   | raw SQL only parameterised through `sql`; identifiers checked as snake_case before they enter SQL                                                                |
| HTTP and events                       | PASS   | generated operations are real actions and queries through @stackra/actions; no endpoint is hand-written                                                          |
| Tenancy                               | PASS   | no scope-owned table here; both isolation layers are hooks (`withScope`, `rowLevelSecurity`) proven by an integration test; no scope level is named              |
| Delegation                            | PASS   | `data-engineer` (route `package`) writes the code and tests; `security-tenancy-reviewer` and `code-reviewer` review                                              |
| Not built yet (ADR 0227)              | PASS   | MikroORM only; no Prisma, Drizzle, TypeORM or Knex; no ORM on a client                                                                                           |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject; Docker tests take `.int`                                                                              |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                |
| Deploy modes (ADR 0076)               | PASS   | identical in SaaS, on-prem and air-gapped                                                                                                                        |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                               |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand                                                                                                   |

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
- **P-006**: `withScope` and `rowLevelSecurity` derive the same setting `app.<level>_id`, and no source file names a scope level — Validates: FR-006
- **P-007**: only `src/testing/` imports `@faker-js/faker` and `@testcontainers/postgresql` — Validates: FR-007

## Deploy modes

| Mode       | Behaviour                                                     |
| ---------- | ------------------------------------------------------------- |
| SaaS       | a library inside each service; connects to its own Postgres   |
| On-prem    | identical: the same build, no SaaS-only code path             |
| Air-gapped | identical: needs no network beyond the service's own database |
