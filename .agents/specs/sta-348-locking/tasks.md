# Tasks: `@stackra/locking` wave 5

**Input**: `.agents/specs/sta-348-locking/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-locking/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/runtime/locking` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `LockDriver` and `LockLease` in `packages/runtime/locking/src/contracts/` — covers: FR-002, P-002, FR-005, P-005 — route: package — deps: T002
- [x] T004 [US1] `LockingConfig` in `packages/runtime/locking/src/config/locking.config.ts`, with `LockingOptions`, `LockingConfig$` and the driver names — covers: FR-003, P-003 — route: package — deps: T002
- [x] T005 [US4] `MemoryLockDriver` in `packages/runtime/locking/src/core/drivers/` — covers: FR-007, P-007 — route: package — deps: T003
- [x] T006 [US1] `Locks` and `LockUnavailableError` in `packages/runtime/locking/src/core/` — covers: FR-002, P-002, FR-004, P-004, FR-008, P-008 — route: package — deps: T004, T005
- [x] T007 [US3] `PostgresLockDriver` and `CreateLockTokensMigration` in `packages/runtime/locking/src/node/` — covers: FR-006, P-006, FR-005, P-005 — route: package — deps: T003
- [x] T008 [US2] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T007
- [x] T009 [US1] Changeset `.changeset/locking-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T008
- [ ] T010 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T009
