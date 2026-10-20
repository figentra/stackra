# Tasks: SDD gates and templates

**Input**: `.agents/specs/sta-163-sdd-gates/`

## Phase 1: User Story 3 - One source for the preset

- [x] T001 [US3] Move the preset to `.agents/speckit/presets/stackra` and add `tools/scripts/speckit-sync.mjs` — covers: FR-001, P-005 — route: spec-task
- [x] T002 [US3] Tripwire: installed copy equals source in `tools/scripts/spec-gate.mjs` — covers: FR-001, P-005 — route: spec-task — deps: T001
- [x] T003 [US3] Template v2: `.agents/speckit/presets/stackra/templates/spec-template.md`, plan and tasks templates, wraps — covers: FR-002, P-006 — route: spec — deps: T001

## Phase 2: User Story 1 - Specs move through gated states

- [x] T004 [US1] Shared parsers in `tools/scripts/spec-parse.mjs` — covers: FR-003, FR-004 — route: spec-task
- [x] T005 [US1] OR12 states, plan and tasks rules in `tools/scripts/spec-gate.mjs` — covers: FR-003, FR-004, P-001, P-002, EC-01 — route: spec-task — deps: T004
- [x] T006 [US1] Lane, branch, bug and ready rules in `tools/scripts/spec-gate.mjs` — covers: FR-005, P-003, EC-02 — route: spec-task — deps: T005
- [x] T007 [US1] Fixture `tools/scripts/__tests__/__fixtures__/sdd/sta-901-widget/spec.md` and tests in `tools/scripts/__tests__/spec-gate.test.mjs` — covers: FR-003, FR-004, FR-005, SC-002 — route: tests — deps: T006

## Phase 3: User Story 2 - Traceability from requirement to test

- [x] T008 [US2] `tools/scripts/spec-trace.mjs` trace and drift — covers: FR-006, FR-007, P-004 — route: spec-task — deps: T004
- [x] T009 [US2] Tests in `tools/scripts/__tests__/spec-trace.test.mjs` — covers: FR-006, FR-007, P-004 — route: tests — deps: T008

## Phase 4: Polish

- [x] T010 Wire `package.json` validate, `.github/workflows/ci.yml` and `lefthook.yml` — covers: FR-008, P-007, SC-001 — route: ci-permissions — deps: T006, T008
- [x] T011 Update `apps/docs/src/agents/spec-lifecycle.mdx` — covers: SC-001 — route: steward-docs — deps: T010
