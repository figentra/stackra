---
description: "Tasks for STA-2057: the identity lock as a table"
---

# Tasks: the identity lock as a table

**Input**: Design documents from `.agents/specs/sta-2057-identity-lock-table/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [ ] T001 Add `report` to `IDENTITY_KINDS` and a `@Renamed` on a report-kind class to its test in `packages/foundation/validation/src/core/constants/identity-kinds.constant.ts` — covers: FR-008, P-005, AC-005 — route: spec-task

## Phase 2: User Story 1 - Every derived identity is locked (Priority: P1)

**Goal**: permissions, roles, config, schemas, endpoints and reports are locked from one table.

**Independent Test**: `check-identity-lock.function.test.ts` and the `refusal-identity-changed` golden.

- [ ] T002 [US1] Tests first: one refused, one renamed and one unchanged case per new row, the set prefix, the bare endpoint path, one refusal per class, generated and duplicated schema entries skipped in `packages/developer/gen/src/core/functions/__tests__/check-identity-lock.function.test.ts` — covers: FR-002, FR-003, FR-004, FR-005, FR-009, P-001, P-003, P-004, AC-001, AC-004 — route: tests — deps: T001
- [ ] T003 [US1] Replace `LOCKED` with the `LOCKS` table and its rows in `packages/developer/gen/src/core/functions/check-identity-lock.function.ts` — covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-009, P-001, P-003, P-004, AC-001, AC-004 — route: spec-task — deps: T002
- [ ] T004 [US1] The `refusal-identity-changed` fixture over `service` and its `FIXTURES` row in `packages/developer/gen/src/node/__tests__/golden.test.ts` — covers: FR-002, FR-003, AC-003 — route: tests — deps: T003

## Phase 3: User Story 2 - A sanctioned event version bump passes (Priority: P1)

**Goal**: a bumped integration event passes the lock and is not a removal.

**Independent Test**: the bump cases of both unit tests.

- [ ] T005 [US2] The event row's `accepts` (stem kept, version grown) and its tests in `packages/developer/gen/src/core/functions/check-identity-lock.function.ts` — covers: FR-006, P-002, AC-002 — route: spec-task — deps: T003
- [ ] T006 [US2] Match a previous event to its bumped successor; tests for the bump and a dropped change after a bump in `packages/developer/gen/src/core/functions/compare-manifests.function.ts` — covers: FR-007, P-002, AC-002 — route: spec-task — deps: T002

## Phase 4: Polish

- [ ] T007 [P] Locked identities row in `packages/developer/gen/README.md` and the fixture row in `packages/developer/gen/__golden__/README.md` — covers: SC-001, AC-003 — route: steward-docs — deps: T004
- [ ] T008 [P] Patch changeset for gen and validation in `.changeset/identity-lock-table.md` — covers: SC-002, AC-005 — route: steward-changesets — deps: T001
- [ ] T009 Gate on ci-box: gen and validation test, typecheck, lint, the golden compare run in `packages/developer/gen/src/node/__tests__/golden.test.ts` — covers: SC-001, SC-002, AC-003 — route: verify-fix — deps: T005, T006, T007, T008
