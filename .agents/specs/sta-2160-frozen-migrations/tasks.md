---
description: "Tasks for STA-2160: locked migrations are frozen by a SHA-256 lock in each service manifest"
---

# Tasks: locked migrations are frozen by a SHA-256 lock in each service manifest

**Input**: Design documents from `.agents/specs/sta-2160-frozen-migrations/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The compiler's frozen path

**Goal**: `@stackra/database` compiles a frozen migration with authoring rules as warnings.

- [x] T001 Test first: an unfrozen migration is refused by the column rule, a frozen one warns and compiles as written, a rule-abiding frozen one compiles to the same SQL, a safety rule still refuses, in `packages/data/database/src/core/functions/__tests__/compile-migration.function.test.ts` — covers: FR-006, P-005, AC-004 — route: tests
- [x] T002 Add the `frozen` option of `CompileOptions` and the `warnings` of `CompiledMigration` in `packages/data/database/src/core/types/compile-options.type.ts` and `packages/data/database/src/core/types/compiled-migration.type.ts`, and pass a `warn` callback through `packages/data/database/src/core/records/schema.record.ts` and `packages/data/database/src/core/records/blueprint.record.ts` from `compileMigration` in `packages/data/database/src/core/functions/compile-migration.function.ts` — covers: FR-006, P-005, AC-004 — route: package — deps: T001

## Phase 2: User Story 1 and 4 - The lock is read, judged and never silently empty (Priority: P1)

**Goal**: pure reading and judging of the committed lock.

**Independent Test**: `migrationLockOf` and `checkMigrationLock` on literal manifests and units.

- [x] T003 [US1] Test first: a well-formed lock, no section, a malformed section and a duplicate id in `packages/developer/gen/src/core/functions/__tests__/migration-lock-of.function.test.ts` — covers: FR-007, P-006, AC-005 — route: tests
- [x] T004 [US1] Add `LockedMigration` in `packages/developer/gen/src/core/types/locked-migration.type.ts` and `migrationLockOf` in `packages/developer/gen/src/core/functions/migration-lock-of.function.ts` — covers: FR-007, P-006, AC-005 — route: package — deps: T003
- [x] T005 [US1] Test first: changed, missing, module gap, `after` gap and pass cases in `packages/developer/gen/src/core/functions/__tests__/check-migration-lock.function.test.ts` — covers: FR-002, FR-003, FR-004, P-002, P-003, AC-002 — route: tests — deps: T004
- [x] T006 [US1] Add `checkMigrationLock` in `packages/developer/gen/src/core/functions/check-migration-lock.function.ts` and export it with `migrationLockOf` and `LockedMigration` from `packages/developer/gen/src/core/index.ts` (checked by `packages/developer/gen/src/core/__tests__/index.test.ts`) — covers: FR-002, FR-003, FR-004, P-002, P-003, AC-002 — route: package — deps: T005

## Phase 3: User Story 2 - New migrations run after the locked ones (Priority: P1)

- [x] T007 [US2] Test first, then keep the locked prefix first in `packages/developer/gen/src/core/functions/order-migrations.function.ts` and its `order-migrations.function.test.ts` — covers: FR-005, P-004, AC-003 — route: package — deps: T006

## Phase 4: Gen writes and enforces the lock

- [x] T008 [US1] Hash each compiled migration (`migrationSha256`, lint lines left out), compile locked ones `frozen`, report `migration_rule_frozen`, check and order under the lock and return it in `packages/developer/gen/src/node/functions/compile-migrations.function.ts` (each unit's `sha256` on `packages/developer/gen/src/core/types/migration-unit.type.ts`) and `packages/developer/gen/src/node/functions/migration-sha256.function.ts`, with their tests — covers: FR-001, FR-002, FR-003, FR-006, P-001, P-007, EC-03, EC-04, EC-06, AC-001, AC-002, AC-004 — route: package — deps: T007
- [x] T009 [US4] Read the committed lock for a service, write the new one into its manifest, carry it in the manifest-only pass, lock no package, compile `stackra db diff` under it, and load source modules by content in `packages/developer/gen/src/node/functions/generate.function.ts`, `packages/developer/gen/src/core/functions/generate-member.function.ts`, `packages/developer/gen/src/node/functions/check-migration-drift.function.ts` and `packages/developer/gen/src/node/functions/load-source-module.function.ts`, with their tests — covers: FR-001, FR-007, FR-008, FR-009, EC-01, EC-02, EC-05, AC-001, AC-005, AC-006, P-008, P-009 — route: package — deps: T008

## Phase 5: Polish

- [x] T010 Amend ADR 0159 (2026-11-26) and add the changeset in `apps/docs/src/docs/adr/0159-migrations-gen-ordered-sql-and-safety-rules.mdx` and `.changeset/frozen-migrations-lock.md` — covers: SC-001, SC-002, SC-003, AC-001 — route: steward-docs — deps: T009
- [ ] T011 Run the `@stackra/gen` and `@stackra/database` tests, typecheck, oxlint and oxfmt, then `pnpm verify`, in `packages/developer/gen/package.json` — covers: SC-001, SC-002, SC-003, SC-004, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: verify-fix — deps: T010
