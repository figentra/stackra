# Tasks: `@stackra/queue` wave 5

**Input**: `.agents/specs/sta-348-queue/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-queue/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/runtime/queue` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `QueueDriver`, `QueuedJob`, `JobError` and `JobStatus` in `packages/runtime/queue/src/contracts/` — covers: FR-007, P-007 — route: package — deps: T002
- [x] T004 [US1] `QueueConfig` in `packages/runtime/queue/src/config/queue.config.ts`, with `QueueOptions`, `QueueConfig$` and the driver names — covers: FR-003, P-003 — route: package — deps: T002
- [x] T005 [US2] `Backoff`, `backoffDelay`, `queues` and `QueueNames` in `packages/runtime/queue/src/core/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T006 [US1] `readJob`, `registerJobs`, `QueueService`, `MemoryQueueDriver` and `QueueJobDispatcherDriver` in `packages/runtime/queue/src/core/` — covers: FR-004, P-004, FR-006, P-006, FR-007, P-007 — route: package — deps: T003, T005
- [x] T007 [US1] `QueueWorkerService`, `JobOutcome`, `JobRun`, `JobTimedOutError` and `UnknownJobError` — covers: FR-005, P-005, FR-008, P-008 — route: package — deps: T006
- [x] T008 [US3] `PostgresQueueDriver` and `CreateJobsMigration` in `packages/runtime/queue/src/node/` — covers: FR-007, P-007 — route: package — deps: T003
- [x] T009 [US4] `drainQueue`, `runJob`, `toDeadLetter` and the testing-module plugin in `packages/runtime/queue/src/testing/` — covers: FR-002, P-002 — route: package — deps: T007
- [x] T010 [US5] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T009
- [x] T011 [US1] Changeset `.changeset/queue-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T011
- [x] T013 [US1] `QueueJobDispatcherDriver` pushes the call's `scope`; `QueueWorkerService` passes the job's scope to the pipeline as the call's; tests, README — covers: FR-005, P-005, FR-006, P-006 — route: package — deps: T007
