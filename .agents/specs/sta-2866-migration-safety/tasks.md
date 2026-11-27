---
description: "Tasks for STA-2866: gen classifies migration safety and runway fills destructive in the deploy evidence"
---

# Tasks: gen classifies migration safety and runway fills destructive in the deploy evidence

**Input**: Design documents from `.agents/specs/sta-2866-migration-safety/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The classifier

**Goal**: every compiled statement gets its ADR 0159 class.

- [x] T001 Test first: each class, created tables, comments and literals, DO blocks and unknowns in `packages/developer/gen/src/core/functions/__tests__/classify-migration-statement.function.test.ts` — covers: FR-001, P-001, EC-01, EC-02, EC-03, EC-04, AC-004 — route: tests
- [x] T002 Add `classifyMigrationStatement` and `migrationSafetyRank` with their types in `packages/developer/gen/src/core/functions/classify-migration-statement.function.ts` and `packages/developer/gen/src/core/functions/migration-safety-rank.function.ts` — covers: FR-001, P-001, AC-004 — route: package — deps: T001

## Phase 2: User Story 2 - Gen refuses a banned statement (Priority: P1)

**Goal**: per-migration classes, the refusal and the safety file.

**Independent Test**: `compileMigrations` on a hermetic host.

- [x] T003 [US2] Test first: highest class, step names, findings, `migration_banned` and the released set in `packages/developer/gen/src/core/functions/__tests__/classify-migrations.function.test.ts` — covers: FR-002, FR-003, P-002, P-003, P-004, AC-004, AC-005 — route: tests — deps: T002
- [x] T004 [US2] Add `classifyMigrations`, `migrationStepNames` (used by `emitMigrations`), `RELEASED_BANNED_MIGRATIONS` and the `MigrationSafety*` types in `packages/developer/gen/src/core/functions/classify-migrations.function.ts`, with `packages/developer/gen/src/core/functions/migration-step-names.function.ts`, `packages/developer/gen/src/core/functions/emit-migrations.function.ts`, `packages/developer/gen/src/core/constants/released-banned-migrations.constant.ts`, `packages/developer/gen/src/core/types/classified-statement.type.ts`, `packages/developer/gen/src/core/types/migration-safety-class.type.ts`, `packages/developer/gen/src/core/types/migration-safety-finding.type.ts`, `packages/developer/gen/src/core/types/migration-safety-row.type.ts`, `packages/developer/gen/src/core/types/migration-safety.type.ts` — covers: FR-002, FR-003, P-002, P-003, P-004, AC-004, AC-005 — route: package — deps: T003
- [x] T005 [US2] Test first: the classes `compileMigrations` returns, its refusal, and a leftover safety file in `packages/developer/gen/src/node/functions/__tests__/compile-migrations.function.test.ts` and `packages/developer/gen/src/node/functions/__tests__/generate.function.test.ts` — covers: FR-003, FR-004, EC-08, AC-004 — route: tests — deps: T004
- [x] T006 [US2] Classify in `compileMigrations`, write each service's migration-safety file (schema stackra.migration-safety v1) in `generate`, export the API from `packages/developer/gen/src/core/index.ts`, with `packages/developer/gen/src/node/functions/generate.function.ts`, `packages/developer/gen/src/core/functions/emit-migration-safety.function.ts`, `packages/developer/gen/src/core/constants/migration-safety-file.constant.ts` — covers: FR-003, FR-004, EC-08, AC-004, AC-005, AC-006 — route: package — deps: T005

## Phase 3: User Story 1 - A destructive migration goes to the owner, a safe one does not (Priority: P1)

**Goal**: the evidence's `destructive` from the classes and the previous deploy.

**Independent Test**: `runway evidence` in a temporary repository.

- [x] T007 [US1] Test first: true, false and null cases, per-member keys and current streams in `packages/developer/runway/src/core/functions/__tests__/destructive-of.function.test.ts`, `stream-is-current.function.test.ts` and `migration-keys-of.function.test.ts` — covers: FR-005, FR-007, P-005, P-006, EC-05, EC-06, AC-001, AC-002, AC-003 — route: tests — deps: T006
- [x] T008 [US1] Add `MIGRATION_SAFETY_FILE_SCHEMA`, `streamIsCurrent`, `destructiveOf`, `migrationKeysOf` and the stream types, and judge `destructive` per target in `packages/developer/runway/src/core/functions/deploy-evidence.function.ts`, with `packages/developer/runway/src/core/constants/migration-safety-file-schema.constant.ts`, `packages/developer/runway/src/core/constants/service-targets.constant.ts`, `packages/developer/runway/src/core/functions/destructive-of.function.ts`, `packages/developer/runway/src/core/functions/migration-keys-of.function.ts`, `packages/developer/runway/src/core/types/deploy-evidence.type.ts`, `packages/developer/runway/src/core/types/deploy-migrations.type.ts`, `packages/developer/runway/src/core/types/migration-stream.type.ts` — covers: FR-005, FR-006, P-005, P-006, AC-001, AC-002, AC-003 — route: package — deps: T007
- [x] T009 [US1] Test first, then read the streams, take `--previous` and write the `runway-migrations` file in `packages/developer/runway/src/node/commands/runway-evidence.command.ts` and its test — covers: FR-007, FR-008, EC-07, AC-001, AC-002, AC-003 — route: package — deps: T008

## Phase 3b: Review fixes

- [x] T012 Test first, then a missing safety file is unknown (`streamIsCurrent`), gen writes an empty safety file for every service (`compileMigrations`, `generate`), and `runway evidence` is `null` for a fresh checkout and a repository with no service, in `packages/developer/runway/src/core/functions/stream-is-current.function.ts`, `packages/developer/gen/src/node/functions/compile-migrations.function.ts` and their tests, with the gen golden trees updated (`UPDATE_GOLDEN=1`) — covers: FR-004, FR-007, P-003, P-005, P-006, EC-08, EC-09, AC-003, AC-007 — route: package
- [x] T013 Test first, then split each compiled string into its top-level statements (`splitSqlStatements`) and class each alone, in `packages/developer/gen/src/core/functions/split-sql-statements.function.ts` and `packages/developer/gen/src/core/functions/classify-migrations.function.ts` — covers: FR-010, P-009, EC-04, AC-009 — route: package
- [x] T014 Test first, then `CREATE TABLE IF NOT EXISTS` marks nothing created, and `database.0005_create_cache_tables` joins `RELEASED_BANNED_MIGRATIONS`, in `packages/developer/gen/src/core/functions/classify-migration-statement.function.ts` — covers: EC-01, AC-005 — route: package
- [x] T015 Test first, then move the `runway-migrations` record from `runway evidence` to the new `runway migrations:record` (after a successful deploy), in `packages/developer/runway/src/node/commands/runway-migrations-record.command.ts`, `packages/developer/runway/src/node/functions/read-migration-streams.function.ts` and the docs — covers: FR-007, FR-009, P-008, AC-008 — route: package
- [x] T016 Test first, then fail closed: mask comments, literals, quoted identifiers and bodies with one scanner (`skipSqlQuoted`, `sqlCodeOf`), class a read or a `DO` block that calls a function outside the read-only list as `contract` and `SELECT … INTO` or a filled `CREATE TABLE … AS` as `banned` (a materialized view judged by its query), in `packages/developer/gen/src/core/functions/classify-migration-statement.function.ts`, `packages/developer/gen/src/core/functions/sql-code-of.function.ts`, `packages/developer/gen/src/core/functions/skip-sql-quoted.function.ts` and their tests — covers: FR-001, P-001, EC-02, EC-03, EC-10, AC-010 — route: package
- [x] T017 Test first, then read a call's whole name in any script (a Unicode lookbehind and name class) and class an `ADD COLUMN` with a volatile default, a `serial`, a stored generated or an identity column as `contract`, in `packages/developer/gen/src/core/functions/classify-migration-statement.function.ts` and its test — covers: EC-11, AC-011, AC-012 — route: package
- [x] T018 Merge `main` (the STA-2160 migration lock), then test first and count a migration the committed lock names as released in `compileMigrations`, in `packages/developer/gen/src/node/functions/compile-migrations.function.ts` and its test — covers: FR-003, AC-013 — route: package

## Phase 4: Polish

- [x] T010 Document the safety file, the refusal and the evidence rules in `packages/developer/gen/README.md`, `apps/docs/src/docs/runway/evidence.mdx` and `.changeset/migration-safety-classes.md` — covers: SC-001, SC-002, AC-001, AC-004 — route: steward-docs — deps: T009
- [ ] T011 Run the gen and runway tests, typecheck, oxlint and oxfmt, the workspace `pnpm gen`, then `pnpm verify`, in `packages/developer/gen/package.json` — covers: SC-001, SC-002, SC-003, SC-004, AC-006 — route: verify-fix — deps: T010
