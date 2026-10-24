# Tasks: `@stackra/theming` wave 3

**Input**: `.agents/specs/sta-348-theming/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-theming/` — covers: SC-001, SC-002 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG, `packages/state/theming/assets/lang`) in `packages/state/theming` — covers: FR-001, FR-006 — route: package — deps: T001
- [x] T003 [US3] `SystemColorScheme` port in `packages/state/theming/src/contracts/` — covers: FR-001 — route: package — deps: T002
- [x] T004 [US1] `ThemingOptions`, `THEMING_CONFIG_SCHEMA`, `ThemingConfig`, `SchemeColors`, `Splash` — covers: FR-002, SC-001 — route: package — deps: T002
- [x] T005 [US2] `ColorSchemeService` and `ColorSchemeState` — covers: FR-002, FR-004, FR-005 — route: package — deps: T003, T004
- [x] T006 [US3] `MemorySystemColorSchemeDriver`, `BrowserSystemColorSchemeDriver`, `AppearanceSystemColorSchemeDriver` — covers: FR-001 — route: package — deps: T003
- [x] T007 [US2] `useColorScheme` in `packages/state/theming/src/react` — covers: FR-003, SC-001 — route: package — deps: T005
- [x] T008 `fakeColorScheme` in `packages/state/theming/src/testing` — covers: SC-003 — route: package — deps: T005, T006
- [x] T009 Tests beside every public symbol and barrel tests (written, not run) — covers: SC-003 — route: package — deps: T003..T008
- [x] T010 Changeset `.changeset/theming-package.md` — covers: SC-002 — route: package — deps: T009
- [ ] T011 Run tests, typecheck and build in the testing workflow — covers: SC-003, SC-004 — route: tests — deps: T010
