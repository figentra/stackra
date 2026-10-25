# Tasks: `@stackra/access-log` wave 5

**Input**: `.agents/specs/sta-348-access-log/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-access-log/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/security/access-log` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] The port and its types in `packages/security/access-log/src/contracts/`; `@AccessLogged` in `src/core/decorators/`; `AccessLogService`, `AccessLogConfig` with its shape and shipped schema, the refusal and the log event in `src/core/` and `src/config/` — covers: FR-002, P-002, FR-004, P-004 — route: package — deps: T002
- [x] T004 [US2] `linkAccessRecord`, `findChainBreak` and the internal hash in `packages/security/access-log/src/core/functions/`; `MemoryAccessLogSinkDriver` in `src/core/drivers/` — covers: FR-005, P-005, FR-006, P-006 — route: package — deps: T003
- [x] T005 [US1] `AccessLogModule` and `AccessLogExplorer` in `packages/security/access-log/src/node/` — covers: FR-003, P-003 — route: package — deps: T003
- [x] T006 [US2] `AccessLogEntry`, `CreateAccessLogEntriesMigration`, `DataClassificationMacro` with its `Blueprint` augmentation, and `PostgresAccessLogSinkDriver` in `packages/security/access-log/src/node/` — covers: FR-006, P-006, FR-007, P-007 — route: package — deps: T004
- [x] T007 [US3] `PurgeAccessLogAction` with `PurgeAccessLogInput` and `PurgeAccessLogOutput` in `packages/security/access-log/src/node/actions/` and `src/node/schemas/` — covers: FR-008, P-008 — route: package — deps: T006
- [x] T008 [US4] `AccessLogSinkFake`, `toHaveLoggedAccess` with its options type in `packages/security/access-log/src/testing/`, and `AccessLogEntryFactory` in `src/node/database/factories/` — covers: FR-009, P-009 — route: package — deps: T006
- [x] T009 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T008
- [x] T010 [US1] Changeset `.changeset/access-log-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T009
- [ ] T011 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T010
