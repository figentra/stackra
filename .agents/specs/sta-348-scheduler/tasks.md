# Tasks: `@stackra/scheduler` wave 6

**Input**: `.agents/specs/sta-348-scheduler/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-scheduler/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/runtime/scheduler` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US3] `ScheduleDriver`, `CronScopes`, `Misfire` and `Schedule` in `packages/runtime/scheduler/src/contracts/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US1] `SchedulerConfig` in `packages/runtime/scheduler/src/config/scheduler.config.ts`, with `SchedulerOptions`, `SchedulerConfig$` and the driver names — covers: FR-003, P-003 — route: package — deps: T002
- [x] T005 [US1] `parseCron`, `cronRuns`, `InvalidCronError` and `registerScheduledJobs` in `packages/runtime/scheduler/src/core/` — covers: FR-004, P-004 — route: package — deps: T003
- [x] T006 [US2] `SchedulerService`, `InvalidTimeZoneError` and the memory drivers in `packages/runtime/scheduler/src/core/` — covers: FR-005, P-005, FR-006, P-006, FR-009, P-009 — route: package — deps: T004, T005
- [x] T007 [US4] `PostgresScheduleDriver` and `CreateSchedulesMigration` in `packages/runtime/scheduler/src/node/` — covers: FR-007, P-007 — route: package — deps: T003
- [x] T008 [US5] `tick` and its testing plugin in `packages/runtime/scheduler/src/testing/` — covers: FR-008, P-008 — route: package — deps: T006
- [x] T009 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T008
- [x] T010 [US1] Changeset `.changeset/scheduler-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T009
- [ ] T011 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T010
- [x] T012 [US1] Read `job.cron.perScope` (renamed from `perTenant` in `@stackra/actions`); tests, README, AGENTS, spec — covers: FR-006, P-006, FR-009, P-009 — route: package — deps: T006
