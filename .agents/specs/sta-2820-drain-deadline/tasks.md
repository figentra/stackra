---
description: "Tasks for STA-2820: the server shutdown drain stops waiting at a deadline"
---

# Tasks: the server shutdown drain stops waiting at a deadline

**Input**: Design documents from `.agents/specs/sta-2820-drain-deadline/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Configuration

**Goal**: `app.http` carries the drain deadline.

- [x] T001 Test first: the default 20, a host override and the schema default equal to the initializer in `packages/runtime/app/src/config/__tests__/http.config.test.ts` — covers: FR-001, P-001, AC-005 — route: tests
- [x] T002 Add `drainTimeoutSeconds` (1 to 600, default 20) to the shape and the shipped schema in `packages/runtime/app/src/core/schemas/http-options.schema.ts` and `packages/runtime/app/src/core/constants/http-config-schema.constant.ts`, with the override example in `packages/runtime/app/src/config/http.config.ts` — covers: FR-001, P-001, AC-005 — route: package — deps: T001

## Phase 2: User Story 1 - A hung call does not stop the shutdown hooks (Priority: P1)

**Goal**: the drain resolves at the deadline and reports once.

**Independent Test**: `createApp` with a memory `ErrorReporter`, hung calls and fake timers.

- [x] T003 [US1] Test first: the error's fields, singular message and that it is not a refusal in `packages/runtime/app/src/server/errors/__tests__/drain-timeout.error.test.ts` — covers: FR-005, P-005, AC-001 — route: tests — deps: T002
- [x] T004 [US1] Add `DrainTimeoutError` in `packages/runtime/app/src/server/errors/drain-timeout.error.ts` and export it from `packages/runtime/app/src/server/index.ts` — covers: FR-005, P-005, AC-001 — route: package — deps: T003
- [x] T005 [US1] Test first: the default deadline, the SIGTERM path and the host override in `packages/runtime/app/src/server/functions/__tests__/create-app.function.test.ts` — covers: FR-002, FR-003, P-002, P-003, EC-02, EC-03, AC-001, AC-002, AC-003 — route: tests — deps: T004
- [x] T006 [US1] Race the calls in flight against the deadline, report once and clear the timer in `packages/runtime/app/src/server/functions/create-app.function.ts` and document it on `packages/runtime/app/src/server/types/server-app.type.ts` — covers: FR-002, FR-003, FR-004, P-002, P-003, P-004, EC-01, EC-04, EC-05, AC-001, AC-002, AC-003, AC-004 — route: package — deps: T005

## Phase 3: User Story 3 - A clean drain stays silent (Priority: P1)

- [x] T007 [US3] Test: calls that settle in time report nothing and leave no timer in `packages/runtime/app/src/server/functions/__tests__/create-app.function.test.ts` — covers: FR-004, P-004, AC-004 — route: tests — deps: T006

## Phase 4: Polish

- [x] T008 Document the deadline, the grace-period rule and the export in `packages/runtime/app/README.md`, `packages/runtime/app/AGENTS.md` and `.changeset/server-drain-deadline.md` — covers: SC-001, SC-002, AC-001, AC-005 — route: steward-docs — deps: T006
- [ ] T009 Run the `@stackra/app` tests, typecheck, oxlint and oxfmt, then `pnpm verify`, in `packages/runtime/app/package.json` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003, AC-004, AC-005 — route: verify-fix — deps: T008
