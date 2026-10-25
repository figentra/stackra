# Feature Specification: `@stackra/database` wave 4, the MikroORM layer

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing (data wave: merges only after the owner's model review)

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/database` (data, wave 4) for real: `CrudService<M>` with `table` and `metrics` (ADR 0307),
repositories and the graph reader, the `Migration`, `Macro` and `Seeder` kinds with a migration compiler, the naming
strategy (`idx_`, `fk_`, `ck_`), the generated-read helpers (`operationAction`, `operationQuery`, `repositoryOf`,
`table`, `sql`), and the `./testing` entry with `Factory` and `usePostgres`. The old `./orm` entry folds into `.`.

## Impact

- **Apps touched**: none (no ORM on a client, ADR 0227 and 0256)
- **Services touched**: none here (the template's services import from `.` and `./testing` already)
- **Packages touched**: `packages/data/database` (new member); `packages/foundation/contracts` gains the `ScopeRef`
  type the scope hooks take
- **Cross-service events**: none
- **Tenancy and data**: it provides both isolation layers as hooks: `Database.withScope(ScopeRef,
work)` sets `app.scope_id`, `app.scope_path` and `app.scope_paths` for the transaction, and the blueprint's `rowLevelSecurity(column, { setting, match })` compiles enable,
  force and the equality policy (ADR 0239). The scope-owning package's macro supplies the column and the setting.
  Wave 9 adds its first tables, in its own schema: `database.sequence_counters`, `sequence_blocks` and
  `sequence_voids` (ADR 0342), each with `scope_id`, `scope_path` and the forced ancestor policy on `app.scope_paths`;
  no personal data (a block's holder is a device's public id). The record-visibility seam (ADR 0333 d4) narrows reads
  inside isolation and never replaces it
- **Secrets**: the connection string is handed to `PostgresDatabaseDriver.connect` by the runtime; never read or logged
  here
- **ADR needed**: no; open naming item for the policy prefix below
- **New dependencies**: `@mikro-orm/postgresql` 7.2.5 (runtime); `@faker-js/faker` 10.6.0 and
  `@testcontainers/postgresql` 12.2.0 as optional peers of `./testing` and dev dependencies; all through `catalog:`
- **Deploy modes**: same in all; talks only to the service's own Postgres
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/data/database/README.md`, `packages/data/database/AGENTS.md`; ADR 0014, 0097, 0105, 0159, 0160, 0190, 0231, 0238, 0239, 0269, 0307, 0333, 0342 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R3 (the persistence and migration contract of every service; the data wave applies)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 package row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR
0294, 0305). The choices recorded when it was specified:

- Owner, 2026-10-24: every column carries a comment and explicit nullability; `schema.createExtension()` takes the
  ADR 0160 extensions only; persisted computed values are generated columns; no observer class; the connection is per
  module through runway topology; extra entries fold into the standard ones (`./orm` into `.`)
- Owner, 2026-10-24: no scope-level vocabulary outside the owning package; scope hooks take the contracts `ScopeRef`
- Owner, 2026-10-24: geographic field types belong to the geography package, not here

## User Scenarios & Testing

### User Story 1 - A module service over one model (Priority: P1)

`class OrderService extends CrudService<Order>` inherits `find`, `findOne`, `findOneOrFail`, `count`, `sum`,
`create`, `insert`, `purge`, `update`, `table` and `metrics`, all on the running context's entity manager.

**Independent Test**: `src/core/bases/__tests__/crud-service.base.test.ts`, `src/core/__tests__/index.test.ts`.

1. **Given** no row matches, **When** `findOneOrFail` runs, **Then** it refuses with `not_found`.
2. **Given** a duplicate key, **When** `insert` runs inside a transaction, **Then** `UniqueViolation` is thrown and the
   caller's transaction stays usable.
3. **Given** a money sum over two currencies, **When** `metrics(...).sum("total.minor")` runs, **Then** it refuses
   with `mixed_currency`.

### User Story 2 - A frozen migration (Priority: P1)

`class CreateOrdersMigration extends Migration { up(schema) {...} }` compiles to ordered SQL steps with dev inverses.

**Independent Test**: `src/core/functions/__tests__/compile-migration.function.test.ts`.

1. **Given** a column without `notNull()`/`nullable()` or `comment()`, **Then** compiling fails naming it.
2. **Given** an index on an existing table, **Then** it must be `concurrently()` and compiles to its own
   non-transactional step.
3. **Given** `schema.createExtension("postgis")`, **Then** compiling fails: not an ADR 0160 extension.

### User Story 3 - Scope isolation hooks (Priority: P1)

A scope-owning package's macro writes its scope column and `t.rowLevelSecurity(column, { setting, match })`; at run time it calls
`database.withScope({ id, path }, work)`.

**Independent Test**: `src/core/drivers/__tests__/postgres-database.driver.int.test.ts` (Testcontainers): an
unprivileged role sees only the rows of the scope set for its transaction, and none without one.

### User Story 4 - Factories and the Postgres fixture (Priority: P2)

`OrderFactory.new().paid().has(OrderLineFactory.new().count(2)).create()` and `usePostgres()` in a `.int.test.ts`.

**Independent Test**: `src/testing/bases/__tests__/factory.base.test.ts`, `src/testing/__tests__/index.test.ts`.

### User Story 5 - Gapless document numbers (Priority: P1)

A module declares `class InvoiceSequence extends Sequence({ key: "invoice", series: ["legalEntityId"], format:
"INV-{year}-{n:06}", reset: "yearly", reserve: { size: 50 } }) {}` in `database/sequences/`, and the action that writes
the invoice calls `sequences.next(InvoiceSequence, ctx.scope, { legalEntityId }, ctx.timeZone)` as its last write; an
offline till reserves a block, issues from it in order, and the server claims, releases or voids it (ADR 0342).

**Independent Test**: `src/core/services/__tests__/sequence.service.test.ts`,
`src/core/services/__tests__/sequence.service.int.test.ts` (Testcontainers), `src/core/bases/__tests__/sequence.base.test.ts`.

1. **Given** eight concurrent commits on one series, **Then** they take eight consecutive numbers.
2. **Given** a write that rolls back after taking a number, **Then** the next commit takes that number.
3. **Given** a wiped device's block with numbers unclaimed or skipped, **Then** they appear as voids with their reasons.
4. **Given** a sequence with `reserve: false`, **When** a block is reserved, **Then** it refuses with
   `sequence_not_reservable`.

### User Story 6 - Record visibility seam (Priority: P2)

A visibility package binds a `VisibilityFilter` driver and the runtime calls `connectVisibilityFilter(container)`; every
read of a declaring model then carries its conditions on top of row-level security (ADR 0333 d4).

**Independent Test**: `src/core/bases/__tests__/crud-service.base.test.ts`,
`src/core/services/__tests__/graph-query.service.test.ts`, `src/core/values/__tests__/metrics-reader.value.test.ts`.

1. **Given** a bound driver, **When** `find`, `findOne`, `findOneOrFail`, `count`, `sum`, `table` or `metrics` runs,
   **Then** the driver's conditions for the running call's actor are ANDed into its filter.
2. **Given** no driver, or a model with no conditions, **Then** the read is unchanged.

### Edge Cases

- A concurrent index on a table the same migration creates is refused (it builds in the transaction).
- A yearly sequence whose format lacks `{year}`, or a never-resetting one with it, is refused at declaration, so a
  formatted number never repeats.
- A device claims a number behind its last accepted one: refused with `sequence_number_out_of_order`; a number ahead
  of it voids the numbers between as skipped.
- A NOT NULL column added to an existing table without a default is refused until a contract step.
- A setting set earlier on a pooled connection reads as `''` after its transaction; the policy treats it as unset.

## Requirements

- **FR-001**: The package SHALL be `@stackra/database` at `packages/data/database`, `tier:lib`, entries `.` and
  `./testing`, the only importer of `@mikro-orm/*`.
- **FR-002**: `.` SHALL export every symbol the template imports: `Aggregate`, `Blueprint`(t), `ColumnGroup`(t),
  `CrudService`, `GraphQuery`, `Macro`, `Migration`, `MigrationId`(t), `Repository`(t), `SchemaBuilder`(t), `Seeder`,
  `UniqueViolation`, `operationAction`, `operationQuery`, `repositoryOf`, `sql`, `table`, `EntitySchema`,
  `OptionalProps`; `./testing` SHALL export `Factory`, `Faker`(t), `usePostgres`.
- **FR-003**: `CrudService<M>` SHALL resolve its model from the registered type argument and run on the running
  context's entity manager; `table` SHALL read by cursor and `metrics` SHALL compute both periods in one statement.
- **FR-004**: `compileMigration` SHALL refuse a column without explicit nullability or a comment, a NOT NULL add
  without a default, a non-concurrent index on an existing table, a concurrent index on a new table, an unapproved
  extension and a raw statement without an inverse.
- **FR-005**: The naming strategy and the compiler SHALL name indexes `idx_`, foreign keys `fk_`, checks `ck_`.
- **FR-006**: Scope hooks SHALL take the contracts `ScopeRef` and name no scope level.
- **FR-007**: `Factory` and `usePostgres` SHALL live in `./testing` only, with Faker and Testcontainers as optional
  peers.
- **FR-008**: `Sequence({ key, series, format, reset, reserve })` SHALL be a called-only kind base that checks and
  records its options, refusing `{year}` without `reset: "yearly"` and a yearly format without `{year}`;
  `registerSequences` SHALL record each class's locked key and refuse a shared key; `formatSequenceNumber` SHALL
  write `{n}`, `{n:0W}` and `{year}` and refuse any other token.
- **FR-009**: `SequenceService.next` SHALL take a number inside the caller's transaction from a counter row locked
  until commit, so concurrent commits on one series take consecutive numbers, a rolled-back write takes none, a
  number is never reused, and a call outside a transaction is refused.
- **FR-010**: `reserve` SHALL hand a holder a block of up to the declared size (refused with
  `sequence_not_reservable` for `reserve: false`); `claim` SHALL accept the holder's numbers in order and void the
  skipped ones; `release` SHALL return the unused remainder (stepping the counter back over a tail block, else handing
  the remainder out first); `void` SHALL record it as voided numbers with a reason.
- **FR-011**: The counter, block and void tables SHALL come from this package's migration in its own schema, each
  with the scope columns and the forced ancestor policy, and no Postgres `SEQUENCE`.
- **FR-012**: A `VisibilityFilter` port SHALL be read, when bound through `connectVisibilityFilter`, by every read of
  `CrudService`, `GraphQuery` and `MetricsReader`, which AND its conditions for the running call's actor into their
  filter; unbound, reads SHALL be unchanged, and the seam SHALL never widen a read or carry scope isolation.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt`, `oxlint` and `tsc --noEmit` are clean on the package.

## Open items (for the owner, not blocking)

- The row-level-security policy is named `pol_<table>_<column>`; ADR 0231 names `idx_`, `fk_` and `ck_` only.
- Gen must register `[Service, Model]` and `[Factory, Model]` pairs (`registerModelPartners`) and entity schemas
  (`registerEntities`), and bind each `repositoryOf(Model)` token; the template's samples do neither yet.
- A `memory` database driver for the template's `useDrivers("memory")` unit tests is not built.
- Gen must call `registerSequences` with each `database/sequences/*.sequence.ts` class and its locked key, bind
  `SequenceService` (dependencies `Database`, `Clock`), apply `database.0001_create_sequence_tables` from
  `src/node/database/migrations/`, and call `connectVisibilityFilter(container)` at boot; the ADR 0342 gen checks (a
  document-number field without a `Sequence`, a migration creating a `SEQUENCE` for one) are not built.
- The device formats offline numbers from the block's `format` and `period`; `formatSequenceNumber` is server-only
  here, so a client needs the same function from a client-safe package.
- The year of a yearly sequence is read in the time zone the caller passes; ADR 0342 does not say whose time zone
  governs a series (the legal entity's is the likely answer).

## Status history

- 2026-10-24 · — → Implementing · Claude (data-engineer) · spec written with the package (owner mode 2026-10-24: develop now, test later)
- 2026-10-25 · Implementing → Implementing · Claude (data-engineer) · wave 9 W9-A: `Sequence` (ADR 0342) and the record-visibility seam (ADR 0333 d4)
