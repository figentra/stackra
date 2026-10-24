# Tasks: `@stackra/versioning` wave 4

**Input**: `.agents/specs/sta-348-versioning/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-versioning/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/communication/versioning` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Change`, `ChangeBase`, `EventChangeBase` in `packages/communication/versioning/src/core/bases/change.base.ts`, with `ChangeOptions` and `ChangeClass` — covers: FR-002, FR-003, P-002, P-003 — route: package — deps: T002
- [x] T004 [US4] `registerChanges` and the internal registry in `packages/communication/versioning/src/core/{functions,constants}/` — covers: FR-004, P-004 — route: package — deps: T003
- [x] T005 [US2] `downgrade` and the internal `eventChangeOf` in `packages/communication/versioning/src/core/functions/` — covers: FR-005, P-005 — route: package — deps: T004
- [x] T006 [US1] `upgrade` in `packages/communication/versioning/src/core/functions/` — covers: FR-006, P-006 — route: package — deps: T005
- [x] T007 [US3] `resolveVersion`, `VERSIONING_HEADERS`, `UnsupportedVersionError`, `VersionSunsetError`, `VersionRequest`, `ResolvedVersion` in `packages/communication/versioning/src/core/` — covers: FR-007, P-007 — route: package — deps: T004
- [x] T008 [US1] Stand-in barrel `packages/communication/versioning/src/core/index.ts` and its export-list test — covers: FR-002 — route: package — deps: T007
- [x] T009 [US1] Tests for every public symbol in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T008
- [x] T010 [US1] Changeset `.changeset/versioning-package.md`; `oxfmt` and `oxlint` clean — covers: SC-001, SC-003 — route: package — deps: T009
- [ ] T011 [US1] Run the package's tests, typecheck (TypeScript 7.0.2 and 6.0.3) and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T009
