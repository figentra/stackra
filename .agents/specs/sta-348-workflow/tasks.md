# Tasks: `@stackra/workflow` wave 7

**Input**: `.agents/specs/sta-348-workflow/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-workflow/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/runtime/workflow` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Workflow`, `Signal`, `@Step`, the status enums and the run, step and journal types in `packages/runtime/workflow/src/core/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US1] `planOf`, `registerWorkflows`, `workflowKey`, `correlationKey` and `mintId` in `packages/runtime/workflow/src/core/functions/` — covers: FR-002, P-002 — route: package — deps: T003
- [x] T005 [US1] The `WorkflowJournal` port and `MemoryWorkflowJournalDriver` — covers: FR-005, P-005 — route: package — deps: T003
- [x] T006 [US1] `NativeWorkflowRunnerDriver`: steps, retries, compensation, waits, timeouts, events, ticks and the worker loop — covers: FR-003, P-003, FR-004, P-004 — route: package — deps: T004, T005
- [x] T007 [US3] `PostgresWorkflowJournalDriver` and `CreateRunsMigration` in `packages/runtime/workflow/src/node/` — covers: FR-005, P-005 — route: package — deps: T005
- [x] T008 [US1] `WorkflowExplorer` and the `startOn` starters — covers: FR-006, P-006 — route: package — deps: T006
- [x] T009 [US4] The test driver in `packages/runtime/workflow/src/testing/` — covers: FR-007, P-007 — route: package — deps: T006
- [x] T010 [US1] `WorkflowConfig` with `WorkflowEngineOptions`, `WorkflowConfig$` and the journal names — covers: FR-008, P-008 — route: package — deps: T005
- [x] T011 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T010
- [x] T012 [US1] Changeset `.changeset/workflow-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T011
- [ ] T013 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T012
