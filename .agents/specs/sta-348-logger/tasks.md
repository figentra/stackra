# Tasks: `@stackra/logger` wave 2

**Input**: `.agents/specs/sta-348-logger/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-logger/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, LICENSE, CHANGELOG) in `packages/foundation/logger` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US3] `LogLevel`, `LoggingOptions`, `TelemetryOptions`, the shipped schemas, `LoggingConfig`, `TelemetryConfig` — covers: FR-002, SC-001 — route: package — deps: T002
- [x] T004 [US2] `redact` with `REDACTED_FIELDS` and `SECRET_PATTERNS` — covers: FR-003 — route: package — deps: T002
- [x] T005 [US1] `LogRecord`, `LogReporter`, `ConsoleLogReporterDriver`, `ChannelLoggerDriver` — covers: FR-003, FR-004 — route: package — deps: T003, T004
- [x] T006 Stand-in barrel for `.` — covers: FR-001, FR-002 — route: package — deps: T005
- [x] T007 Tests beside every subject and the barrel test — covers: SC-002, SC-003 — route: tests — deps: T006
- [x] T008 Changeset `.changeset/logger-package.md` — covers: SC-001 — route: package — deps: T006
- [ ] T009 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T007
