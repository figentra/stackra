# Tasks: No code without an answered questionnaire and a plan (the plan gate)

**Input**: `.agents/specs/sta-614-os-planning-decisions/`

## Phase 1: User Story 1 - An agent cannot write code before the plan

- [x] T001 [US1] Gate in `.agents/hooks/_rules.mjs` and `.agents/hooks/guard-paths.mjs` — covers: FR-001, FR-002, FR-004, P-001, P-002, P-004, EC-01, EC-02 — route: spec-task
- [x] T002 [US1] Tests in `.agents/hooks/__tests__/plan-gate.test.mjs` — covers: FR-001, FR-002, FR-004, P-001, P-002, P-004 — route: tests — deps: T001
- [x] T003 [US1] ADR `apps/docs/src/adr/0362-no-code-without-an-answered-questionnaire-and-a-plan.mdx` and `.agents/hooks/README.md` — covers: FR-001, SC-001 — route: spec-task — deps: T001

## Phase 2: User Story 2 - The owner lets a hotfix go first

- [x] T004 [US2] Hotfix marker and its write rule in `.agents/hooks/_rules.mjs` — covers: FR-003, P-003 — route: spec-task — deps: T001
- [x] T005 [US2] Hotfix tests in `.agents/hooks/__tests__/plan-gate.test.mjs` — covers: FR-003, P-003 — route: tests — deps: T002, T004
- [ ] T006 [US1] Run `pnpm test:hooks` and `pnpm verify` — covers: SC-001 — route: tests — deps: T002, T005
