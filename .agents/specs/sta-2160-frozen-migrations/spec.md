# Feature Specification: locked migrations are frozen by a SHA-256 lock in each service manifest

**Feature Branch**: `figentra/sta-2160-frozen-migrations`

**Created**: 2026-11-26

**Status**: Tasked <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2160

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: ADR 0159 says a migration is frozen once it may have been applied, and its 2026-10-23 note asks gen to lock
each compiled migration with a SHA-256 in `stackra.manifest.json`. Nothing wrote or read that lock: editing an applied
migration only failed at `stackra db migrate`, in the environment, after the change had merged. The leader's decision
of 2026-11-06 (os 0.14 migration, decision 5) says a migration is frozen by its locked or applied state, never by a
merge to main. This spec is written after the fact from the PR's diff (#1123), which was built before the spec gate
(ADR 0502) required one.

### Sources

- `packages/developer/gen/src/node/functions/compile-migrations.function.ts`, `generate.function.ts`,
  `check-migration-drift.function.ts` and `load-source-module.function.ts` (before and after this change)
- `packages/developer/gen/src/core/functions/order-migrations.function.ts` and `generate-member.function.ts`
- `packages/data/database/src/core/functions/compile-migration.function.ts`, `records/blueprint.record.ts`,
  `records/schema.record.ts`, `types/compile-options.type.ts`, `types/compiled-migration.type.ts`
- ADR 0159 (decisions 1 to 4, the 2026-10-23 note, and the amendment of 2026-11-26 this PR adds); the leader's
  decision of 2026-11-06 (os 0.14 migration, decision 5)
- FR-001 to FR-009: the PR's diff against `main` and its tests (listed under Success Criteria)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none (every service with migrations gains a `migrations` section in its committed
  `stackra.manifest.json` the next time it runs `stackra gen`)
- **Packages touched**: packages/developer/gen (`checkMigrationLock`, `migrationLockOf`, `LockedMigration`,
  `MigrationUnit.sha256`, `orderMigrations`, `compileMigrations`, `generate`, `generateMember`,
  `checkMigrationDrift`, `loadSourceModule`, `migrationSha256`), packages/data/database (`CompileOptions.frozen`,
  `CompiledMigration.warnings`, `compileMigration`, `SchemaRecord.compile`, `BlueprintRecord.compile`)
- **Public contract change**: additive. New exports `checkMigrationLock`, `migrationLockOf` and the type
  `LockedMigration` from `@stackra/gen`; `MigrationUnit` gains an optional `sha256`; `orderMigrations` takes an
  optional second argument (the locked ids). `@stackra/database`'s `CompileOptions` gains an optional `frozen` and
  `CompiledMigration` an optional `warnings`. A service's `stackra.manifest.json` gains a `migrations` section (a list
  of `{ id, sha256 }` in apply order). New gen refusal codes `migration_locked_changed`, `migration_locked_missing`,
  `migration_lock_gap`, `migration_lock_malformed` and the warning `migration_rule_frozen`. No member, key or export
  is removed or renamed.
- **Cross-service events**: none
- **Tenancy and data**: no runtime data. The lock stops gen from rewriting SQL a database may already have applied, so
  it protects every tenant's schema history; nothing reads tenant rows.
- **Security and privacy**: none. The lock holds migration ids and SHA-256 digests of compiled SQL only.
- **Secrets**: none
- **ADR needed**: no new ADR; ADR 0159 is amended (2026-11-26, STA-2160) to record the lock as built, carrying out the
  leader's decision of 2026-11-06
- **New dependencies**: none (`node:crypto` only)
- **Deploy modes**: same in all three (gen runs at development time)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/adr/0159-migrations-gen-ordered-sql-and-safety-rules.mdx` (amendment of
  2026-11-26), `.changeset/frozen-migrations-lock.md` (minor for `@stackra/gen` and `@stackra/database`)
- **Lane**: full (new behaviour and new public exports across two packages)
- **Change risk**: R2 (a public contract in two packages; every service's `stackra gen --check` reports its manifest
  stale until the lock is committed)

## Glossary _(full lane)_

- **Migration lock**: the `migrations` section of a service's committed `stackra.manifest.json`: each compiled
  migration's id and the SHA-256 of what it compiled to, in apply order.
- **Locked migration**: a migration whose id the committed lock names. It may already be applied somewhere.
- **Frozen**: a locked migration must compile to the SQL it was locked with and keep its place in the order.
- **Authoring rule**: a rule that only checks how a migration is written (every column states its nullability and has
  a comment), as opposed to a **safety rule** (an index on an existing table is built concurrently, and the like).
- **Migration SHA-256**: `migrationSha256`: the hash of a compiled migration's `after` ids and each step's
  transactional flag, statements and inverse, with whole lint comment lines left out, as the runner's checksum leaves
  them out.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - An edit to a locked migration is refused at gen, not in the environment (Priority: P1)

A developer edits a migration that was generated, locked and committed earlier (it may be applied in staging). `stackra
gen` refuses the change with `migration_locked_changed` and a fix that says to make the change in a new migration,
before anything merges.

**Why this priority**: today the edit merges and only `stackra db migrate` fails, in the environment.

**Independent Test**: `generate` a service with a migration, keep the manifest, edit the migration, generate again.

**Acceptance Scenarios**:

1. **Given** a service whose manifest locks `billing.0001_create_invoices`, **When** that migration's source changes
   what it compiles to, **Then** gen refuses with `migration_locked_changed` naming the migration and writes nothing.
2. **Given** the same service, **When** the migration file is deleted or renamed, **Then** gen refuses with
   `migration_locked_missing`.
3. **Given** a locked migration, **When** a new migration is added whose module's previous migration or `after` id is
   not locked and would run before a locked one, **Then** gen refuses with `migration_lock_gap`.

---

### User Story 2 - A new migration still runs after the locked ones (Priority: P1)

A developer adds a migration, or a new package with its own migrations, to a service that already has locked ones.
Gen keeps the locked migrations at the head of the order, in their locked order, and appends the new ones; the lock
grows.

**Why this priority**: the runner applies by sequence number, so a released prefix must never move.

**Independent Test**: `orderMigrations` and `compileMigrations` with a lock and an extra unit.

**Acceptance Scenarios**:

1. **Given** a lock of two migrations, **When** a package migration is added that sorts before them, **Then** it is
   ordered after them and the lock lists it last.

---

### User Story 3 - A rule added later does not refuse a locked migration (Priority: P2)

`@stackra/database` adds an authoring rule after a migration was locked. The locked migration still compiles as it was
locked, gen reports a `migration_rule_frozen` warning, and the SQL still hashes as locked. A safety rule still refuses.

**Acceptance Scenarios**:

1. **Given** a locked migration with a column that has no comment, **When** gen compiles it, **Then** it compiles with
   one `migration_rule_frozen` warning and the same lock.
2. **Given** the same migration unlocked, **When** gen compiles it, **Then** the column rule refuses it.

---

### User Story 4 - A broken or stale lock never silently unfreezes (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a `migrations` section that is not a list of `{ id, sha256 }` (64 lowercase hex), or names an id twice,
   **When** gen or `stackra db diff` reads it, **Then** it is refused with `migration_lock_malformed`, never read as
   empty.
2. **Given** a service manifest without its lock, **When** `stackra gen --check` runs, **Then** the manifest is
   reported stale.

---

### Edge Cases

- **EC-01**: A manifest-only gen pass (`generateMember`) carries the committed lock unchanged, so it never unlocks a
  migration; only the migration target rewrites the section.
- **EC-02**: A package's own migrations are compiled and checked but not locked: only a service's database applies
  them, and each hosting service's lock freezes them.
- **EC-03**: A lock that names migrations while none remain on disk is refused (`migration_locked_missing`).
- **EC-04**: A migration on disk that fails to compile is refused once; its lock entry is not also reported missing.
- **EC-05**: An edited migration file loaded twice in one process (gen, then `stackra db diff`) is read anew: the
  module URL names the file's content.
- **EC-06**: Whole lint comment lines (`-- squawk-ignore …`, `-- lint: …`) do not change the SHA-256.
- **EC-07**: To change a locked migration that no environment has applied, a developer removes its entry by hand in a
  reviewed diff and runs `stackra gen` again.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE gen migration target SHALL write, for a service, a `migrations` section to `stackra.manifest.json`
  listing each compiled migration's id and `migrationSha256`, in apply order.
- **FR-002**: IF a locked migration compiles to a different SHA-256 THEN gen SHALL refuse it with
  `migration_locked_changed` and write nothing.
- **FR-003**: IF a locked migration is gone THEN gen SHALL refuse with `migration_locked_missing`.
- **FR-004**: IF a locked migration has its module's previous migration or an `after` id that is not locked THEN gen
  SHALL refuse with `migration_lock_gap`.
- **FR-005**: `orderMigrations` SHALL place the locked migrations first, in their locked order, and order the rest
  after them as before.
- **FR-006**: WHEN `compileMigration` runs with `frozen: true` THE compiler SHALL return an authoring-rule breach in
  `warnings` instead of throwing, and SHALL still throw on a safety rule; gen SHALL report each as a
  `migration_rule_frozen` warning.
- **FR-007**: IF the `migrations` section is malformed THEN gen and `stackra db diff` SHALL refuse it with
  `migration_lock_malformed`.
- **FR-008**: `stackra db diff` (`checkMigrationDrift`) SHALL read the committed lock and compile under it, as gen does.
- **FR-009**: THE manifest-only pass SHALL carry the committed lock unchanged, and a package member SHALL lock nothing.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a service is generated THE gen SHALL write its migration lock to `stackra.manifest.json`, and `stackra gen --check` SHALL report a service manifest without it as stale.
- **AC-002**: WHEN a locked migration is changed, removed or left behind an unlocked predecessor THE gen SHALL refuse the run with the matching code and write nothing.
- **AC-003**: WHEN a new migration is added THE gen SHALL order it after every locked migration.
- **AC-004**: WHERE a locked migration breaks a rule added since its lock THE gen SHALL compile it with a `migration_rule_frozen` warning, and a safety rule SHALL still refuse.
- **AC-005**: IF the committed lock is malformed THEN THE gen and `stackra db diff` SHALL refuse it with `migration_lock_malformed`.
- **AC-006**: WHILE a member is a package THE gen SHALL check its migrations and lock none.

## Success Criteria _(mandatory)_

- **SC-001**: `check-migration-lock.function.test.ts`, `migration-lock-of.function.test.ts`,
  `order-migrations.function.test.ts` ("with a locked prefix") and `migration-sha256.function.test.ts` prove FR-002
  to FR-005, FR-007 and EC-06 — verified by: unit
- **SC-002**: `compile-migrations.function.test.ts` ("under the migration lock"), `generate.function.test.ts`
  ("generate's migration lock"), `generate-member.function.test.ts` and `check-migration-drift.function.test.ts`
  prove FR-001, FR-006, FR-008, FR-009 and AC-001 to AC-006 — verified by: unit
- **SC-003**: `compile-migration.function.test.ts` ("of a frozen migration") proves FR-006 in `@stackra/database`, and
  `load-source-module.function.test.ts` proves EC-05 — verified by: unit
- **SC-004**: the `@stackra/gen` and `@stackra/database` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- A service that predates the lock has no `migrations` section: nothing is frozen until its next `stackra gen` writes
  one, and `stackra gen --check` reports the manifest stale until it is committed.
- A migration that was applied but never locked is still guarded by the runner's checksum (`stackra db migrate`).
- Upgrading: run `stackra gen` in each service with migrations and commit its manifest (the changeset says so).

## Risks

- **R-1**: A developer can still remove a lock entry by hand. Mitigated: the change is a reviewed manifest diff, the
  fix text says to do so only when no environment applied the migration, and the runner's checksum still refuses an
  applied file that changed.
- **R-2**: A `@stackra/database` change that alters the SQL a migration compiles to (not only a rule) would refuse
  every locked migration it touches. That is the intent: such a change must keep the compiled output stable.

## Out of scope

- Reading the applied state from a database at gen time (gen cannot see one).
- Locking a package's own migrations in the package.

## Assumptions

- The committed manifest is the lock's source of truth; CI runs `stackra gen --check`.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2160 spec, batch 21) · written after the fact from the diff of PR #1123
- 2026-11-26 · Draft → Clarified · Claude (STA-2160 spec, batch 21) · clarifications complete (none open)
- 2026-11-26 · Clarified → Planned · Claude (STA-2160 spec, batch 21) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2160 spec, batch 21) · tasks.md; the tasks marked done are already on the branch (PR); Implementing waits for the approver's Planned approval (ADR 0502)
