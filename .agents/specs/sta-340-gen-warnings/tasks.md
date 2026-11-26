---
description: "Tasks for STA-340: gen warnings, and ADR 0101's action-first checks"
---

# Tasks: gen warnings, and ADR 0101's action-first checks

**Input**: Design documents from `.agents/specs/sta-340-gen-warnings/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: User Story 1 - A warning prints and gen still succeeds (Priority: P1)

**Goal**: a `GenError` can be a warning; gen and the CLI print it and carry on.

**Independent Test**: `formatGenError` on a warning; `runGen` with a warning-only result.

- [x] T001 [US1] Tests first: the warning form in `packages/developer/gen/src/core/functions/__tests__/format-gen-error.function.test.ts` — covers: FR-001, FR-002, P-001, AC-001 — route: tests
- [x] T002 [US1] `severity` on `GenError` and the word in `formatGenError` in `packages/developer/gen/src/core/functions/format-gen-error.function.ts` — covers: FR-001, FR-002, AC-001 — route: spec-task — deps: T001
- [x] T003 [US1] Tests first: a warning-only IR writes and returns `warnings` in `packages/developer/gen/src/core/functions/__tests__/generate-member.function.test.ts`; a warning-only result resolves true, an error false, in `packages/developer/cli/src/node/functions/__tests__/run-gen.function.test.ts` — covers: FR-003, FR-004, P-002, P-003, AC-002, AC-003 — route: tests — deps: T002
- [x] T004 [US1] Split warnings in `generateMember`, pass them through `generate` and `GenerateResult`, print them in `runGen` in `packages/developer/gen/src/core/functions/generate-member.function.ts` — covers: FR-003, FR-004, AC-002, AC-003 — route: spec-task — deps: T003

## Phase 2: User Stories 2 and 3 - ADR 0101's checks (Priority: P1)

**Goal**: `action_without_workflow` warns; `workflow_without_action` refuses.

**Independent Test**: `checkActionFirst` over hand-built IRs.

- [x] T005 [US2] Tests first: every trigger and silence of both codes in `packages/developer/gen/src/core/functions/__tests__/check-action-first.function.test.ts` — covers: FR-005, FR-006, P-004, P-005, AC-004, AC-005, AC-006 — route: tests — deps: T004
- [x] T006 [US2] The reader's `workflows` fact in `packages/developer/gen/src/node/functions/create-source-reader.function.ts` and `DeclaredClass` — covers: FR-007, P-006, AC-006 — route: spec-task — deps: T005
- [x] T007 [US3] `checkActionFirst`, its barrel export and its line in the full pass in `packages/developer/gen/src/core/functions/check-action-first.function.ts` — covers: FR-005, FR-006, AC-004, AC-005, AC-006, AC-007 — route: spec-task — deps: T006

## Phase 3: Polish

- [x] T008 [P] ADR 0101's Enforcement and note lines, gen's AGENTS.md line in `apps/docs/src/docs/adr/0101-action-first-workflow-behind-when-needed.mdx` — covers: FR-005, FR-006 — route: steward-docs — deps: T007
- [x] T009 [P] Changeset (gen minor, cli patch) in `.changeset/gen-warnings.md` — covers: SC-001, AC-001 — route: steward-changesets — deps: T007
- [ ] T010 Gate on ci-box: gen and cli test (goldens included), typecheck, lint in `packages/developer/gen/src/core/functions/__tests__/check-action-first.function.test.ts` — covers: SC-001, AC-002, AC-007 — route: verify-fix — deps: T008, T009
