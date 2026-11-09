---
description: "Tasks for STA-2066: the sort and filter index checks judge this run's resource trees"
---

# Tasks: the sort and filter index checks judge this run's resource trees

**Input**: Design documents from `.agents/specs/sta-2066-table-index-checks-current/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: User Story 1 - An unindexed sort is refused in the run that adds it (Priority: P1)

**Goal**: `sort_not_indexed` and `filter_not_indexed` judge this run's recorded trees.

**Independent Test**: `generateMember` with a recorded tree and no committed manifest.

- [x] T001 [US1] Tests first: a tree read this run refuses with no committed manifest; a tree only the committed manifest holds does not in `packages/developer/gen/src/core/functions/__tests__/check-table-indexes.function.test.ts` — covers: FR-001, FR-002, P-001, P-002, AC-001, AC-002 — route: tests
- [x] T002 [US1] Pass this run's manifest and rename the parameter in `packages/developer/gen/src/core/functions/generate-member.function.ts` and `packages/developer/gen/src/core/functions/check-table-indexes.function.ts` — covers: FR-001, FR-002, AC-001, AC-002 — route: spec-task — deps: T001

## Phase 2: Polish

- [x] T003 [P] Patch changeset for gen in `.changeset/table-index-checks-current.md` — covers: SC-001, AC-001 — route: steward-changesets — deps: T002
- [ ] T004 Gate on ci-box: gen test, typecheck, lint in `packages/developer/gen/src/core/functions/__tests__/check-table-indexes.function.test.ts` — covers: SC-001, AC-001, AC-002 — route: verify-fix — deps: T002, T003
