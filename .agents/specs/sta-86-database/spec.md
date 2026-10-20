# Feature Specification: @stackra/database, the only MikroORM importer

**Feature Branch**: `figentra/sta-86-database-spec`

**Created**: 2026-10-20

**Status**: Draft <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded; spec-gate ci checks the artifacts each stage needs -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

<!-- Folder: .agents/specs/sta-n-<slug>/, named by the Linear key below (ADR 0120 D1). -->

**Linear**: STA-86

**Linear project**: Data layer (W2.2, STA-56)

**Clarifications status**: pending <!-- /speckit.clarify sets this to "complete" when nothing is open -->

**Input**: User description: "Draft the specify-stage spec for `packages/data/database` (roadmap W2.2, STA-86): the only
`@mikro-orm/*` importer; `EntitySchema` from gen, the cursor paginator, the rich CRUD API behind `@Crud`, `@Link` and
`query.graph`, factories, seeders and migrations as SQL files, with the nestjs-orm feature list and its five additions
(ADRs 0097, 0014, 0104, 0105)."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none (services consume it later; the first is the reference service of FW10)
- **Packages touched**: packages/data/database (new). It implements the `@stackra/validation` rule-driver contract (STA-79) and reads `@stackra/model` metadata (STA-85); developer/gen (STA-92) calls its schema emitter; developer/console hosts its commands
- **Cross-service events**: none. Trait hooks may stage events, but publishing is `@stackra/outbox`'s job (ADR 0078 decision 4)
- **Tenancy and data**: no tenant-owned table of its own. It provides the per-model connection resolver contract and the scoped-entity filter hook that `@stackra/tenancy` uses for pool tenancy with RLS (ADR 0088 decisions 3 and 7), and the migration stream every tenant-owned table goes through
- **Secrets**: none stored or named by the package. The connection comes from the runtime (ADR 0014 decision 5); the `HasEncryptedFields` key is a reference resolved by the runtime, never a value in config (ADR 0009)
- **ADR needed**: no for this spec (Accepted ADRs 0097, 0014, 0096, 0104 and 0105 decide it; it also relies on 0046 and 0088, which are still Proposed and are decided by the owner, not here). Read replicas are a new design (ADR 0097 decision 6) and get their own ADR if the plan adopts them
- **New dependencies**: `@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/migrations`, `dataloader` in pnpm catalogs (exact pins, dependency-steward)
- **Deploy modes**: SaaS: Postgres provided by the generated Encore app; migrations applied by its runner. On-prem: the customer's Postgres; the same SQL migration files run as a pre-upgrade job. Air-gapped: as on-prem, with no outbound call; required Postgres extensions ship in the images (ADR 0076 decisions 1 and 2)
- **Lane**: full (roadmap W2.2)
- **Change risk**: R3 (tenancy and RLS hooks, tenant-data migrations, PII field encryption)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Persist and read models through MikroORM without MikroORM decorators (Priority: P1)

A service author declares `@Model` classes and boots `DatabaseModule`. The package maps model metadata to MikroORM
`EntitySchema` definitions (the same function gen uses to emit them), connects over the connection the runtime provides, and
gives a repository and an entity manager per request. No other package imports `@mikro-orm/*` (ADR 0097 decisions 2 and 3, ADR 0014
decisions 1 and 5).

**Why this priority**: Nothing that stores data works without it.

**Independent Test**: Against a real Postgres, a `User` model is inserted, read by id and by public id, updated and deleted
through the package; the import graph shows `@mikro-orm/*` only under this package.

**Acceptance Scenarios**:

1. **Given** a `User` model and `DatabaseModule`, **When** a user is created, **Then** its key is a UUIDv7 and its public id decodes back to that key (ADR 0082).
2. **Given** a relation `Post → User`, **When** posts are loaded with the author eager-loaded, **Then** one query batch loads them without N+1.
3. **Given** any package other than this one, **When** it imports `@mikro-orm/*`, **Then** `boundaries.jsonc` fails the lint (ADR 0097 Enforcement).

---

### User Story 2 - Change the schema with migrations that reach every deploy mode (Priority: P1)

A service author changes a model and runs the make-migration command. The package produces an ordered SQL migration file that
the service owns; the same file applies in SaaS and on-prem (ADR 0014 decisions 2 and 6) [NEEDS CLARIFICATION: DP12 — recommended:
(a) gen writes ordered SQL files into the generated service's migrations folder; Encore's runner applies them; on-prem runs the
same files as a pre-upgrade job]. A package that ships tables brings its migrations into the host's stream [NEEDS CLARIFICATION:
FW4 — recommended: (a) gen pulls each installed package's migrations into the host stream, namespaced by package and ordered by
dependency].

**Why this priority**: The roadmap gates this plan on the migration spike STA-137; identity and notifications need package
migrations.

**Independent Test**: A model change produces one SQL file; applying the stream to an empty database twice is a no-op the second
time; a package's migration lands before the host migration that references it.

**Acceptance Scenarios**:

1. **Given** a new field on a model, **When** the make-migration command runs, **Then** one new ordered SQL file appears and nothing else changes.
2. **Given** the migration stream, **When** it is applied to an empty Postgres, **Then** the schema matches the models.
3. **Given** a migration that creates a table with `tenant_id`, **When** it is checked, **Then** it also enables and forces RLS, or the check fails (ADR 0088 Enforcement).
4. **Given** a destructive change, **When** the migration is generated, **Then** it follows the zero-downtime rules the owner settles [NEEDS CLARIFICATION: DP13 — recommended: (a) expand/contract, destructive steps in a later release, lock and statement timeouts, concurrent index builds alone, squawk lint, backfills as queue jobs].

---

### User Story 3 - List, page and mutate through one rich CRUD API (Priority: P1)

A module service with `@Crud` inherits retrieve, list, list-and-count, create, update, delete, soft-delete and restore, with list
filtering, sorting and includes limited to what the model declares, and cursor pagination by default (ADR 0105 decisions 1 and 2,
ADR 0097 decisions 4 and 5).

**Why this priority**: Actions and the console build every resource on this API.

**Independent Test**: A `@Crud` service lists 50 rows with a cursor of 20, filters by an allowed field, refuses an undeclared
filter, and a hand-written `list` overrides the generated one.

**Acceptance Scenarios**:

1. **Given** 50 rows, **When** `list({ limit: 20 })` runs, **Then** it returns 20 rows, `nextCursor` and `hasMore: true`.
2. **Given** a filter on a field the model did not allow, **When** `list` runs, **Then** an STK invalid-argument error names the field.
3. **Given** a hand-written `create` on the service, **When** it is called, **Then** it runs instead of the generated one.
4. **Given** offset or simple pagination requested explicitly, **When** `list` runs, **Then** the requested paginator is used.

---

### User Story 4 - Read across modules with links (Priority: P2)

A module that depends on two others declares `@Link` between their models; `query.graph({ entity, fields, filters })` calls each
owning module's query and joins in memory, batched through the DataLoader (ADR 0104 decisions 1 to 3).

**Independent Test**: `query.graph` on `order` with `customer.email` makes one batched call per owning module.

**Acceptance Scenarios**:

1. **Given** a link `Order ↔ Customer`, **When** 100 orders are read with the customer email, **Then** the customer module is called once with 100 ids.
2. **Given** tenancy on the customer module, **When** the graph fans out, **Then** that module's pipeline applies its own tenant filter (ADR 0104 decision 3).

---

### User Story 5 - Seed and test with factories and seeders (Priority: P2)

An author declares a factory with states for a model (`HasFactory`) and module seeders, and runs the seed command on
`@stackra/console` (ADR 0097 decisions 4 and 5.5, ADR 0096 decision 4) [NEEDS CLARIFICATION: DA1 — recommended: (a)
`db:seed --profile=minimal|demo|test` built from module seeders; demo is the golden tenant].

**Independent Test**: `UserFactory.state("admin").createMany(3)` inserts three admins; the seed command is idempotent.

**Acceptance Scenarios**:

1. **Given** a factory with an `admin` state, **When** `createMany(3)` runs with that state, **Then** three rows with the state's values exist.

---

### User Story 6 - Delete policy, pruning, versioning and encrypted fields as traits (Priority: P2)

A model opts into `SoftDeletes`, `Archivable`, `Prunable`, `Versionable` or `HasEncryptedFields`; the package runs them as
MikroORM subscribers and named filters (ADR 0096 decision 4, ADR 0046 decision 2, ADR 0097 decision 4).

**Independent Test**: A soft-deleted row is absent from default lists, present with the trashed filter, and restorable; a
`Versionable` update with a stale version fails with a typed conflict error; an encrypted field is ciphertext in the table.

**Acceptance Scenarios**:

1. **Given** `SoftDeletes`, **When** a row is deleted, **Then** it is hidden by default and restorable within the policy [NEEDS CLARIFICATION: DA7 — recommended: (a) soft is restorable 30 days then pruned; archive kept until tenant deletion].
2. **Given** `Versionable`, **When** two writers update the same version, **Then** the second fails with an optimistic-lock error [NEEDS CLARIFICATION: DA8 — recommended: (a) optimistic concurrency only].
3. **Given** `Prunable`, **When** the prune command runs, **Then** rows past the retention window are hard-deleted in chunks [NEEDS CLARIFICATION: DA6 — recommended: (a) platform retention defaults, tenant overrides within bounds].
4. **Given** `HasEncryptedFields`, **When** the row is read through the package, **Then** the field decrypts; read raw, it is ciphertext [NEEDS CLARIFICATION: SC13 — recommended: (a) a per-environment KMS key wraps a per-tenant data key; on-prem from the customer's secret store or HSM].

---

### User Story 7 - Answer async validation rules and report health (Priority: P3)

`@Unique` and `@Exists` from `@stackra/validation` are answered by this package's rule driver (ADR 0095 decision 4); a health
check reports database reachability and migration state (ADR 0097 decision 5.5).

**Independent Test**: A `@Unique` email fails `parseAsync` when a row exists; the health check is `down` when Postgres stops.

### Edge Cases

- A flush hits a unique, foreign-key or optimistic-lock violation: the error is a typed STK error (unique, reference, optimistic lock, connection), never a raw driver error.
- A bulk upsert of 10 000 rows runs in chunks without loading them all into the identity map.
- A request ends with unflushed changes: they are discarded, never flushed implicitly.
- A query runs with no tenant context on a tenant-owned model: it sees zero rows (RLS), and the tenancy kit tests it (ADR 0088 decision 7).
- A migration needs an extension not on the approved list: it fails review [NEEDS CLARIFICATION: DA11 — recommended: (a) approve `pgvector`, `pg_trgm`, `ltree`, `citext`, `pgcrypto`].
- Emitted `EntitySchema` files go where the owner settles [NEEDS CLARIFICATION: C37 — proposed: emitted into the gitignored `.stackra/` output and checked by `gen --check`, not committed].

## Requirements _(mandatory)_

### Functional Requirements

EARS wording (ADR 0120 D18).

- **FR-001**: The package shall be the only package that imports `@mikro-orm/*` (ADR 0097 decision 2).
- **FR-002**: The package shall map `@stackra/model` metadata to MikroORM `EntitySchema` definitions, through one function that gen calls to emit them; MikroORM decorators shall not be used (ADR 0097 decision 3).
- **FR-003**: The package shall run MikroORM over the connection the runtime provides and shall not provision databases (ADR 0014 decision 5).
- **FR-004**: The package shall give each request or unit of work its own forked entity manager and shall flush only explicitly or at a unit-of-work boundary.
- **FR-005**: The package shall run model traits as a MikroORM subscriber and model scopes as named filters (ADR 0097 decision 4).
- **FR-006**: The package shall ship the traits `HasFactory`, `SoftDeletes`, `Archivable`, `Prunable`, `Versionable` and `HasEncryptedFields`, created with `createTrait` (ADR 0096 decision 4).
- **FR-007**: The package shall provide three paginators, cursor (the default), offset and simple, plus chunk, upsert and bulk operations (ADR 0097 decision 4; cursor lists per constitution http-and-events).
- **FR-008**: The package shall provide the rich CRUD API consumed by `@Crud`: retrieve, list, list-and-count, create, update, delete, soft-delete and restore, with list filtering, sorting and includes limited to what the model declares (ADR 0105 decision 1, ADR 0097 decision 5.1 and 5.3).
- **FR-009**: If a list call names a filter, sort or include the model did not declare, then the package shall reject it with an STK invalid-argument error.
- **FR-010**: The package shall provide `@Link` resolution and `query.graph({ entity, fields, filters })`, calling each owning module's query and batching through a DataLoader (ADR 0104 decisions 1 to 3, ADR 0097 decision 4).
- **FR-011**: When a flush fails, the package shall throw a typed STK error for unique, reference, optimistic-lock and connection failures (ADR 0097 decision 4) [NEEDS CLARIFICATION: FW7 — recommended: (a) error kinds with STK codes in `@stackra/contracts`, mapped to API errors by gen].
- **FR-012**: The package shall provide factories with states and seeders, and migrate, seed and make commands registered on `@stackra/console` (ADR 0097 decisions 4 and 5.5).
- **FR-013**: The package shall produce migrations as ordered SQL files owned by the service; raw SQL shall be allowed in migrations for triggers, generated columns, extensions and indexes (ADR 0014 decisions 2 and 6) [NEEDS CLARIFICATION: DP12 — recommended: (a) SQL files applied by Encore's runner; on-prem pre-upgrade job].
- **FR-014**: Where an installed package ships migrations, the host's migration stream shall include them in a defined order [NEEDS CLARIFICATION: FW4 — recommended: (a) pulled by gen, namespaced by package, ordered by dependency].
- **FR-015**: When a migration creates a table with `tenant_id`, the package's migration check shall require RLS to be enabled and forced on it (ADR 0088 decision 2 and Enforcement, ADR 0046 decision 1).
- **FR-016**: The package shall define the per-model connection resolver contract and ship the pool resolver; the Pro DB-per-tenant driver shall plug into the same contract without being present here (ADR 0088 decision 3, ADR 0097 decision 4).
- **FR-017**: The package shall expose the hook `@stackra/tenancy` uses to scope entities by tenant, so isolation holds at the ORM and the database policy (ADR 0088 decision 7, ADR 0014 decision 7).
- **FR-018**: The package shall implement the `@stackra/validation` rule driver for `@Exists` and `@Unique` (ADR 0095 decision 4).
- **FR-019**: The package shall provide a database health check and pruning for `Prunable` models (ADR 0097 decisions 4 and 5.5).
- **FR-020**: The package shall contribute model and schema entries to the gen manifest instead of keeping a runtime schema registry (ADR 0097 decision 5.4).
- **FR-021**: The package shall leave read replicas out of this spec; they are a new design (ADR 0097 decision 6) and need their own spec or ADR.
- **FR-022**: The package shall not import `encore.dev` (ADR 0124 decision 3).
- **FR-023**: Every database behaviour shall be tested against real Postgres in the package's `__tests__` [NEEDS CLARIFICATION: TS4 — recommended: (a) Testcontainers (Postgres with pgvector and ltree, Valkey, MinIO) in vitest global setup, one schema per test file].
- **FR-024**: The package's entries and layout shall follow the layout chosen for every package [NEEDS CLARIFICATION: FW1 — recommended: (a) entries first: `contracts`, `node`, `testing`; no client entry].
- **FR-025**: The package shall publish a types-only `./contracts` entry (paginator, CRUD, connection-resolver, error and factory types) with no runtime imports (ADR 0117 decision 2).

### Key Entities

- **EntitySchema**: MikroORM's mapping for one model, derived from model metadata.
- **Migration**: an ordered SQL file in a service's migration stream; may come from an installed package.
- **Paginator**: cursor (default), offset or simple; returns rows, `nextCursor` and `hasMore` for cursor.
- **CRUD API**: the generated service methods behind `@Crud`.
- **Link**: a cross-module relation with its own pivot, read through `query.graph`.
- **Factory / Seeder**: test and seed data builders, with factory states.
- **Connection resolver**: picks the connection for a model and tenant; pool by default.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The migration spike STA-137 has passed before this spec's plan starts (roadmap Phase 2 gate).
- **SC-002**: Every feature in ADR 0097 decision 4 and the five additions of decision 5 has at least one test against real Postgres.
- **SC-003**: `boundaries.jsonc` fails a fixture package that imports `@mikro-orm/core` outside this package.
- **SC-004**: Loading 100 rows with one eager relation issues a bounded number of queries (no N+1), asserted in a test.
- **SC-005**: Applying the full migration stream twice to an empty database leaves the schema unchanged the second time.
- **SC-006**: The conformance suite for the connection resolver passes with network egress denied (ADR 0076 decisions 5 and 6).
- **SC-007**: `pnpm verify` is green with the package added.

## Glossary

- **Unit of work**: MikroORM's change set for one request, flushed once.
- **Named filter**: a MikroORM filter enabled by default or on demand, used for scopes and delete policies.
- **Cursor pagination**: paging by an opaque position, the default for every list.
- **query.graph**: a read across linked models of several modules, joined in memory.
- **Pool tenancy**: all tenants in shared tables, isolated by `tenant_id` and RLS.
- **Migration stream**: the ordered set of SQL migrations one service applies, including those from installed packages.

## Assumptions

- `@stackra/model`, `@stackra/config`, `@stackra/container` and `@stackra/logger` are merged before the plan starts (roadmap W2.2).
- The migration spike STA-137 decides the mechanism the DP12 and FW4 answers point to.
- Tenancy itself (RLS policies, `withTenant`, the isolation kit) is `@stackra/tenancy` (STA-102); this package only provides its hooks.
- The nestjs-orm reference (`archive/monorepo-main/packages/infra/orm`) is the feature list, not code to copy; Medusa DML is background only and its Enterprise paths are never used.
- Agents never run migrations against a shared database; `guard-bash` blocks it.

## Open items

- [NEEDS CLARIFICATION: DP12 — recommended: (a) SQL files applied by Encore's runner; on-prem runs them as a pre-upgrade job]
- [NEEDS CLARIFICATION: FW4 — recommended: (a) gen pulls package migrations into the host stream, namespaced and dependency-ordered]
- [NEEDS CLARIFICATION: DP13 — recommended: (a) mandatory zero-downtime migration rules, backfills as queue jobs]
- [NEEDS CLARIFICATION: FW1 — recommended: (a) entries-first package layout]
- [NEEDS CLARIFICATION: FW7 — recommended: (a) error kinds with STK codes in `@stackra/contracts`]
- [NEEDS CLARIFICATION: C37 — proposed: emitted EntitySchema files are generated output, not committed, checked by `gen --check`]
- [NEEDS CLARIFICATION: DA1 — recommended: (a) seed profiles minimal, demo, test]
- [NEEDS CLARIFICATION: DA6 — recommended: (a) platform retention defaults]
- [NEEDS CLARIFICATION: DA7 — recommended: (a) archive and soft delete stay distinct]
- [NEEDS CLARIFICATION: DA8 — recommended: (a) `Versionable` is optimistic concurrency only]
- [NEEDS CLARIFICATION: DA11 — recommended: (a) approved Postgres extensions list]
- [NEEDS CLARIFICATION: SC13 — recommended: (a) KMS key per environment wrapping per-tenant data keys]
- [NEEDS CLARIFICATION: TS4 — recommended: (a) Testcontainers for package integration tests]
