---
description: "Tasks for STA-1408: stackra db diff derives trait columns from the model's traits"
---

# Tasks: `stackra db diff` derives trait columns from the model's traits

**Input**: Design documents from `.agents/specs/sta-1408-db-diff-trait-columns/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The trait column table

**Goal**: gen knows what each column-writing trait's macro writes.

- [x] T001 Test first: rows by registry code, a namespaced trait, a marker or unknown trait, a trait named twice, a later column winning, and `Partitioned`'s optional BRIN index in `packages/developer/gen/src/core/functions/__tests__/trait-columns-of.function.test.ts` — covers: FR-001, FR-002, P-001, P-002, EC-01, EC-02, EC-03, EC-05 — route: tests
- [x] T002 Add `TraitColumns` in `packages/developer/gen/src/core/types/trait-columns.type.ts`, `TRAIT_COLUMNS` in `packages/developer/gen/src/core/constants/trait-columns.constant.ts` and `traitColumnsOf` in `packages/developer/gen/src/core/functions/trait-columns-of.function.ts`, exported from `packages/developer/gen/src/core/index.ts` (checked by `packages/developer/gen/src/core/__tests__/index.test.ts`) — covers: FR-001, FR-002, P-001, P-002 — route: package — deps: T001

## Phase 2: User Story 1 - A tree model agrees with its migration (Priority: P1)

**Goal**: the expected schema carries the trait columns and indexes, and the diff reads them.

**Independent Test**: `expectedSchema` and `diffSchemas` on a `HasTree` model.

- [x] T003 [US1] Test first: trait-typed columns over the checker's fields, a base model's traits, `version` only under `Versioned`, `Partitioned`'s index, an `@Index` winning in `packages/developer/gen/src/core/functions/__tests__/expected-schema.function.test.ts` — covers: FR-003, FR-006, P-003, EC-04, AC-001, AC-004, AC-005 — route: tests — deps: T002
- [x] T004 [US1] Expect the trait columns and indexes in `packages/developer/gen/src/core/functions/expected-schema.function.ts`, widen `packages/developer/gen/src/core/types/schema-snapshot.type.ts` (`nullable: "either"`, `optional`), and stop typing `version` by name in `packages/developer/gen/src/core/functions/postgres-type-of.function.ts` (its test updated) — covers: FR-003, FR-006, P-003, AC-001, AC-005 — route: package — deps: T003
- [x] T005 [US1] Test first: either nullability, an optional index, a missing or other-method index, a trait column of another type in `packages/developer/gen/src/core/functions/__tests__/diff-schemas.function.test.ts` — covers: FR-004, P-004, EC-06, AC-001, AC-002 — route: tests — deps: T004
- [x] T006 [US1] Compare `either`, `optional` and the access method in `packages/developer/gen/src/core/functions/diff-schemas.function.ts` — covers: FR-004, P-004, EC-06, AC-001, AC-002 — route: package — deps: T005

## Phase 3: User Story 2 - A trait's column without the trait is reported (Priority: P1)

- [x] T007 [US2] Drop the blanket `tree_path` / `metadata` tolerance in `packages/developer/gen/src/core/functions/diff-schemas.function.ts`, with its test — covers: FR-005, P-005, AC-003 — route: package — deps: T006

## Phase 4: User Story 3 - Option-bearing traits are read (Priority: P2)

- [x] T008 [US3] Keep a trait object argument's constant properties in `packages/developer/gen/src/node/functions/create-source-reader.function.ts`, with its test — covers: FR-007, AC-004 — route: package — deps: T002

## Phase 5: Polish

- [x] T009 Document `stackra db diff`'s trait columns in `packages/developer/cli/README.md` and `.changeset/db-diff-trait-columns.md` — covers: SC-001, SC-002, SC-003, AC-001 — route: steward-docs — deps: T007, T008
- [ ] T010 Run the `@stackra/gen` tests, typecheck, oxlint and oxfmt, then `pnpm verify`, in `packages/developer/gen/package.json` — covers: SC-001, SC-002, SC-003, SC-004, SC-005, AC-001, AC-002, AC-003, AC-004, AC-005 — route: verify-fix — deps: T009
