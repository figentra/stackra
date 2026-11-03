---
description: "Tasks for STA-2068: gen check codes named as gen emits them, built checks off the planned rows"
---

# Tasks: gen's check codes named as gen emits them, and built checks no longer marked planned

**Input**: Design documents from `.agents/specs/sta-2068-docs-check-names/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [ ] T001 Merge origin/main into the branch and list gen's quoted snake_case literals to check each documented code against, in `packages/developer/gen/src/core/types/gen-error.type.ts` — covers: FR-002, FR-003, AC-003 — route: gen

## Phase 2: User Story 3 - A wrong code in a built row fails the build (Priority: P2)

**Goal**: a built row naming a code gen does not have fails the gen tests.

**Independent Test**: the test passes on the corrected docs and fails on a planted fake code.

- [ ] T002 [US3] Test first: parse the Enforcement rows of the checked documents, assert every code on an `automated —` row is a gen literal and no document names `two_kinds_in_file`, in `packages/developer/gen/src/core/constants/__tests__/gen-codes-documented.test.ts` — covers: FR-001, FR-004, P-001, P-002, EC-01, EC-02, EC-03, EC-04, AC-001, AC-002 — route: tests — deps: T001
- [ ] T003 [US3] Add the test task inputs for the checked documents in `packages/developer/gen/turbo.jsonc` — covers: FR-004, AC-002 — route: gen — deps: T002

## Phase 3: User Story 1 - A reader finds the code gen prints (Priority: P1)

**Goal**: ADR 0294 names `two_declarations_in_file`.

**Independent Test**: `git grep two_kinds_in_file` is empty.

- [ ] T004 [US1] Rename the check in `apps/docs/src/docs/adr/0294-programming-model-v3-grammar-folders-identities-and-naming.mdx` — covers: FR-001, P-001, AC-001 — route: steward-docs — deps: T002

## Phase 4: User Story 2 - The docs say which gen checks are built (Priority: P1)

**Goal**: each built gen check sits on an `automated —` row; only missing checks stay planned.

**Independent Test**: the test passes, and the diff matches the spec's acceptance scenarios.

- [ ] T005 [P] [US2] Split the gen-check rows of ADR 0294 and ADR 0305 in `apps/docs/src/docs/adr/0294-programming-model-v3-grammar-folders-identities-and-naming.mdx` and `apps/docs/src/docs/adr/0305-programming-model-v3-1-names-partners-files-and-class-components.mdx` — covers: FR-002, FR-003, P-003, AC-003 — route: steward-docs — deps: T004
- [ ] T006 [P] [US2] Split the gen-check rows of ADR 0263 and ADR 0307 in `apps/docs/src/docs/adr/0263-di-stays-and-gen-writes-the-wiring.mdx` and `apps/docs/src/docs/adr/0307-panel-v3-1-resource-tables-placements-widgets-slots-and-dashboards.mdx` — covers: FR-002, FR-003, P-003, AC-003 — route: steward-docs — deps: T002
- [ ] T007 [US2] Split the rows of the rules and regenerate the projection in `.agents/rules/ai-tools.md`, `.agents/rules/naming-and-casing.md` and `AGENTS.md` — covers: FR-002, FR-003, FR-005, P-003, P-004, AC-003 — route: steward-docs — deps: T002

## Phase 5: Polish

- [ ] T008 Run the gen test, lint, typecheck and pnpm validate on ci-box, plant a fake code once to see the test fail, and format with oxfmt, in `packages/developer/gen/src/core/constants/__tests__/gen-codes-documented.test.ts` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003 — route: verify-fix — deps: T003, T005, T006, T007
