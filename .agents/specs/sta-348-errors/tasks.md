# Tasks: `@stackra/errors` wave 1c

**Input**: `.agents/specs/sta-348-errors/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-errors/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/foundation/errors` — covers: FR-001, FR-007 — route: package — deps: T001
- [x] T003 [US1] `ErrorKind`, `refusalCode`, `RefusalOptions`, `RefusalDetails`, `RefusalClass` — covers: FR-005 — route: package — deps: T002
- [x] T004 [US1, US2] `Refusal` kind base, `ErrorEnvelope`, `ErrorCategory`, `FieldErrors` — covers: FR-002, FR-005 — route: package — deps: T003
- [x] T005 [US2] The eight core refusals and `CoreRefusals` — covers: FR-002 — route: package — deps: T004
- [x] T006 [US3] `isRefusal` — covers: FR-006 — route: package — deps: T004
- [x] T007 [US3] `packages/foundation/errors/src/contracts` `ErrorReporter`, `packages/foundation/errors/src/react` `useErrorReporter` — covers: FR-003, FR-004 — route: package — deps: T002
- [x] T008 [US4] `packages/foundation/errors/src/testing` `refusal`, `toRefuseWith` — covers: FR-004 — route: package — deps: T006
- [x] T009 Stand-in barrels for the four entries — covers: FR-001, FR-003 — route: package — deps: T005, T007, T008
- [x] T010 Tests beside every subject and the barrel tests — covers: SC-002, SC-003 — route: tests — deps: T009
- [x] T011 Changeset `.changeset/errors-package.md` — covers: SC-001 — route: package — deps: T009
- [ ] T012 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010
