---
description: "Tasks for STA-340 call-shape refusals in gen (wp-17)"
---

# Tasks: Call-shape refusals in gen

**Input**: Design documents from `.agents/specs/sta-340-call-shape-checks/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [ ] T001 Merge origin/main in and install on ci-box, confirming the gen goldens pass before any change, in `packages/developer/gen/src/node/__tests__/golden.test.ts` — covers: FR-007, AC-006 — route: gen

## Phase 2: User Story 1 - Gen refuses a misshapen call (Priority: P1)

**Goal**: one pure check refuses the five codes from the action entry block.

**Independent Test**: `check-call-shape.function.test.ts`, one fixture per code beside a conforming one.

- [x] T002 [US1] Write the fixtures for `query_above_l1`, `query_precondition`, `action_cache`, `step_up_missing` and `idempotency_missing` first, each beside a conforming fixture, in `packages/developer/gen/src/core/functions/__tests__/check-call-shape.function.test.ts` — covers: FR-001, FR-002, FR-003, FR-004, FR-005, P-001, P-002, P-003, P-004, P-005, EC-01, EC-02, EC-03, EC-04, AC-001, AC-002, AC-003, AC-004, AC-005 — route: tests — deps: T001
- [x] T003 [US1] Implement `checkCallShape` in `packages/developer/gen/src/core/functions/check-call-shape.function.ts` and export it from `packages/developer/gen/src/core/index.ts` — covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, P-006, SC-001 — route: gen — deps: T002
- [x] T004 [US1] Call it once per entry from the action entry block in `packages/developer/gen/src/core/functions/build-manifest.function.ts` — covers: FR-006, P-006, AC-006 — route: gen — deps: T003

## Phase 3: User Story 2 - Step-up asks only a user (Priority: P1)

**Goal**: the pipeline asks `StepUpCheck` only of a user caller; the three mixed-actor classes declare `stepUp`.

**Independent Test**: `action-pipeline.service.test.ts`.

- [x] T005 [US2] Test a service caller of a `stepUp` action running with no `StepUpCheck` bound and a user caller still asked, first, in `packages/application/actions/src/core/services/__tests__/action-pipeline.service.test.ts` — covers: FR-008, P-007, EC-05, EC-06, AC-007, SC-003 — route: tests — deps: T001
- [x] T006 [US2] Ask step-up only when the caller is `ActorKind.User` in `packages/application/actions/src/core/services/action-pipeline.service.ts` — covers: FR-008, P-007, AC-007, SC-003 — route: package — deps: T005
- [x] T007 [US2] Declare `stepUp: AssuranceLevel.Aal2` in `packages/security/identity/src/node/actions/bootstrap-operator.action.ts`, `packages/security/identity/src/node/actions/end-user-sessions.action.ts` and `packages/security/privacy/src/node/actions/release-hold.action.ts` — covers: FR-004, FR-009, AC-004 — route: package — deps: T006

## Phase 4: Fix today's offenders and regenerate

**Goal**: every committed manifest and golden passes the new check.

**Independent Test**: `stackra gen --check` over every member and each fixed package's tests on ci-box.

- [x] T008 Write the `idempotency` policy each refused client write already has in the action classes of `packages/security/identity`, `packages/security/privacy`, `packages/security/access-log`, `packages/commerce/loyalty-kit`, `packages/data/data-maintenance`, `packages/data/media` and `packages/experience/collaboration` — covers: FR-005, FR-007, EC-04, AC-006 — route: package — deps: T004
- [ ] T009 Regenerate every committed `stackra.manifest.json` (the fixed packages and `apps/playground`) and any golden expectation under `packages/developer/gen/__golden__/` on ci-box, and run `stackra gen --check`, the gen and actions tests and the fixed packages' tests — covers: FR-007, FR-009, P-008, SC-002, AC-006 — route: codegen-drift — deps: T007, T008

## Phase 5: Polish

- [x] T010 [P] Move the shipped rows from planned to enforced in `.agents/rules/http-conventions.md` and re-project the AGENTS.md block with `tools/scripts/agents-sync.mjs` — covers: SC-001 — route: steward-docs — deps: T009
- [x] T011 [P] List the new codes in `packages/developer/gen/README.md`, update the Enforcement lines of `apps/docs/src/docs/adr/0136-action-runtime-contract.mdx` and `apps/docs/src/docs/adr/0207-authentication-assurance-and-machine-identities.mdx`, and add the dated user-callers-only amendment to `apps/docs/src/docs/adr/0406-step-up-is-an-action-option-checked-after-the-permission-and-the-call-carries-its-assurance.mdx` — covers: FR-008, SC-001, SC-003 — route: steward-docs — deps: T009
- [x] T012 [P] Add the changeset for `@stackra/gen`, `@stackra/actions` and the fixed packages in `.changeset/sta-340-call-shape-checks.md` — covers: SC-002 — route: steward-changesets — deps: T009
