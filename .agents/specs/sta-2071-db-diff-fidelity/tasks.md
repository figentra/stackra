---
description: "Tasks for STA-2071: db diff fidelity: many-to-many pivots, search columns, deep predicate normalisation"
---

# Tasks: `db diff` fidelity: many-to-many pivots, search columns, deep predicate normalisation

**Input**: Design documents from `.agents/specs/sta-2071-db-diff-fidelity/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [ ] T001 Correct the pivot name in the contract comment of `packages/data/model/src/core/types/many-to-many-options.type.ts` to `<table>_<field>` — covers: FR-009, AC-001 — route: spec-task

## Phase 2: User Story 1 - A many-to-many pivot is expected (Priority: P1)

**Goal**: every `m:n` relation yields its pivot table in the expected schema, so a migrated pivot agrees.

**Independent Test**: `expectedSchema` for a model with an `m:n` relation returns the pivot's columns and foreign
keys; `diffSchemas` over it and a matching migrated pivot returns nothing.

- [ ] T002 [US1] Test derived and named pivots, self-reference, cross-module target, tenant owner, base-model relation and a shared pivot name in `packages/developer/gen/src/core/functions/__tests__/expected-schema.function.test.ts` — covers: FR-001, FR-002, FR-003, FR-004, P-001, P-002, P-003, EC-01, EC-02, EC-03, EC-04, EC-08, AC-001 — route: tests — deps: T001
- [ ] T003 [US1] Expect pivot tables, their key and tenant columns and foreign keys in `packages/developer/gen/src/core/functions/expected-schema.function.ts` — covers: FR-001, FR-002, FR-003, FR-004, P-001, P-002, P-003, AC-001 — route: spec-task — deps: T002
- [ ] T004 [US1] Test a matching pivot (no difference, automatic key indexes tolerated) and an absent one (`missing_table`) in `packages/developer/gen/src/core/functions/__tests__/diff-schemas.function.test.ts` — covers: FR-001, SC-002, EC-06, AC-002 — route: tests — deps: T003

## Phase 3: User Story 2 - `@Searchable` drift is reported (Priority: P1)

**Goal**: a searchable model expects its search columns, and search columns elsewhere are undeclared.

**Independent Test**: `diffSchemas` reports `missing_column` for a searchable table without the columns and
`undeclared_column` for search columns on a plain table.

- [ ] T005 [US2] Test `search_text` and `search_filters` for `@Searchable` on the class and on an own base model, and none without it, in `packages/developer/gen/src/core/functions/__tests__/expected-schema.function.test.ts` — covers: FR-005, P-004, EC-05, AC-003 — route: tests — deps: T003
- [ ] T006 [US2] Expect the search columns of a `@Searchable` model in `packages/developer/gen/src/core/functions/expected-schema.function.ts` — covers: FR-005, P-004, AC-003 — route: spec-task — deps: T005
- [ ] T007 [US2] Test missing search columns, undeclared search columns on a plain table, and tolerated per-locale vectors, `__v2` shadows and search indexes on a searchable table in `packages/developer/gen/src/core/functions/__tests__/diff-schemas.function.test.ts` — covers: FR-006, P-005, EC-06, AC-004, AC-005 — route: tests — deps: T004, T006
- [ ] T008 [US2] Imply search columns only on a table that expects `search_text` in `packages/developer/gen/src/core/functions/diff-schemas.function.ts` — covers: FR-006, P-005, AC-004, AC-005 — route: spec-task — deps: T007

## Phase 4: User Story 3 - A predicate Postgres rewrote is not `index_shape` (Priority: P2)

**Goal**: a partial index's source predicate and Postgres's rendering compare equal.

**Independent Test**: each FR-007 pair gives no difference; a changed meaning still gives `index_shape`.

- [ ] T009 [US3] Test each FR-007 rewrite pair, a cast followed by `and`, and changed values, operators and connectives in `packages/developer/gen/src/core/functions/__tests__/diff-schemas.function.test.ts` — covers: FR-007, FR-008, P-006, EC-07, AC-006 — route: tests — deps: T008
- [ ] T010 [US3] Normalise predicates as FR-007 lists, with a shortcut note for the rest, in `packages/developer/gen/src/core/functions/diff-schemas.function.ts` — covers: FR-007, FR-008, P-006, AC-006 — route: spec-task — deps: T009

## Phase 5: Polish

- [ ] T011 [P] Say that pivots, search columns and rewritten predicates are compared in the `db diff` section of `packages/developer/cli/README.md` — covers: FR-001, FR-005, FR-007, AC-002 — route: steward-docs — deps: T010
- [ ] T012 [P] Add a patch changeset for `@stackra/gen` and `@stackra/model` in `.changeset/sta-2071-db-diff-fidelity.md` — covers: SC-003, AC-001 — route: steward-changesets — deps: T010
- [ ] T013 Run the gen and model gates (format, lint, typecheck, test, build) on ci-box for `packages/developer/gen` and `packages/data/model` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: verify-fix — deps: T011, T012
