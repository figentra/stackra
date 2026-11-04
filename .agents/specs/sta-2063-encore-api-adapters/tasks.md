---
description: "Tasks for STA-2063: the Encore service and api() adapters"
---

# Tasks: gen writes the Encore service and an api() adapter per action and query

**Input**: Design documents from `.agents/specs/sta-2063-encore-api-adapters/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [ ] T001 Merge origin/main into the branch and confirm the gen tests and goldens pass before the change in `packages/developer/gen` — covers: SC-003 — route: verify-fix

## Phase 2: User Story 1 - A service gets its Encore service declaration (Priority: P1)

**Goal**: every service gets `encore.service.ts`.

**Independent Test**: the emitter test over a service, a package and an app IR.

- [x] T002 [US1] Service, package and app cases in `packages/developer/gen/src/core/functions/__tests__/emit-encore-service.function.test.ts` — covers: FR-001, P-001, AC-001 — route: tests — deps: T001
- [x] T003 [US1] `emitEncoreService` in `packages/developer/gen/src/core/functions/emit-encore-service.function.ts` — covers: FR-001, P-001, AC-001 — route: spec-task — deps: T002

## Phase 3: User Story 2 - Each action and query with an endpoint gets an api() adapter (Priority: P1)

**Goal**: one `api()` per own endpoint, calling the pipeline with the verified actor.

**Independent Test**: the emitter test over an action, a query, an anonymous query, an `endpoint: false` action and a
hosted entry; the box type-check of the golden `api.ts`.

- [x] T004 [US2] Action, query, anonymous, no-endpoint, hosted and unresolved-shape cases in `packages/developer/gen/src/core/functions/__tests__/emit-encore-api.function.test.ts` — covers: FR-002, FR-003, FR-004, FR-005, FR-006, P-002, P-003, P-004, AC-002, AC-003, AC-004 — route: tests — deps: T001
- [x] T005 [US2] `emitEncoreApi` in `packages/developer/gen/src/core/functions/emit-encore-api.function.ts` — covers: FR-002, FR-003, FR-004, FR-005, FR-006, P-002, P-003, P-004, AC-002, AC-003, AC-004 — route: spec-task — deps: T004
- [x] T006 [US2] Add both emitters to the Encore list in `packages/developer/gen/src/core/functions/generate-member.function.ts` and regenerate the goldens under `packages/developer/gen/__golden__/` — covers: FR-001, FR-002, AC-001 — route: spec-task — deps: T003, T005
- [ ] T007 [US2] Box type-check of the golden `api.ts` and `encore.service.ts` against `encore.dev` installed out of tree, with a stand-in `~encore/auth`, from an untracked script in `.claude/worktrees/sta-2063` — covers: SC-002, AC-005 — route: verify-fix — deps: T006

## Phase 4: Polish

- [x] T008 [P] Docs: the endpoints and what waits for wp-114 in `packages/developer/gen/README.md`; the anonymous opt-in in `.agents/rules/http-conventions.md` and AGENTS.md — covers: FR-004, FR-005, AC-003 — route: steward-docs — deps: T006
- [x] T009 [P] Changeset (minor: `@stackra/gen`) in `.changeset/sta-2063-encore-api-adapters.md` — covers: SC-003, AC-001 — route: steward-changesets — deps: T006
- [ ] T010 Box run: `pnpm verify` for `packages/developer/gen` in `packages/developer/gen` — covers: SC-001, SC-003, AC-001 — route: verify-fix — deps: T007, T008, T009
