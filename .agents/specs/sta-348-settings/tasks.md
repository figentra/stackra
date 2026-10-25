# Tasks: `@stackra/settings` wave 5

**Input**: `.agents/specs/sta-348-settings/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-settings/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/state/settings` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Settings`, `@Setting`, `SettingScope`, `SettingType` and the option and rule types in `packages/state/settings/src/core/` — covers: FR-002, P-002, FR-003, P-003, FR-004, P-004, FR-011, P-011 — route: package — deps: T002
- [x] T004 [US2] `SettingValueStore` and its types in `packages/state/settings/src/contracts/`, `MemorySettingValueStoreDriver`, the refusals and the layer functions in `packages/state/settings/src/core/` — covers: FR-006, P-006 — route: package — deps: T002
- [x] T005 [US2] `SettingsReader` in `packages/state/settings/src/core/services/settings-reader.service.ts` — covers: FR-005, P-005, FR-008, P-008 — route: package — deps: T003, T004
- [x] T006 [US3] `settingKeys` and `settingsPage` in `packages/state/settings/src/core/functions/` — covers: FR-007, P-007 — route: package — deps: T003
- [x] T007 [US2] `StoredSetting`, `StoredSettingService`, `PostgresSettingValueStoreDriver` and the migration in `packages/state/settings/src/node/` — covers: FR-006, P-006 — route: package — deps: T004
- [x] T008 [US3] `SettingsForm` in `packages/state/settings/src/native/settings-form/` with the lang catalogues in `packages/state/settings/assets/lang/` — covers: FR-009, P-009 — route: package — deps: T005, T006
- [x] T009 [US4] `fakeSettings` and `SettingsFake` in `packages/state/settings/src/testing/` — covers: FR-010, P-010 — route: package — deps: T005
- [x] T010 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T009
- [x] T011 [US1] Changeset `.changeset/settings-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T011
