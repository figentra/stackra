# Tasks: `@stackra/feature-flags` wave 2

**Input**: `.agents/specs/sta-348-feature-flags/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-feature-flags/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, LICENSE) in `packages/state/feature-flags` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US3] `FlagProvider`, `FlagContext` (`./contracts`), `FlagProviderName` and its `DriverRegistry` augmentation — covers: FR-002 — route: package — deps: T002
- [x] T004 [US1] `Flag`, `FlagOptions`, `FlagClass`, `FlagScope`, `DEFAULT_FLAG_SCOPES`, `flagRefs`, `FlagRef`, `FlagRefInput`, `FlagRefs` — covers: FR-002 — route: package — deps: T002
- [x] T005 [US3] `FlagTargeting`, `FeatureFlagsOptions`, the shipped schema, `FeatureFlagsConfig` — covers: FR-003, FR-004 — route: package — deps: T003
- [x] T006 [US2] `FlagSubjects`, `FlagReader`, `ConfigFlagProviderDriver`, `PosthogFlagProviderDriver` — covers: FR-003, FR-005 — route: package — deps: T004, T005
- [x] T007 [US2] `useFlag` (`./react`); [US4] `FlagsFake`, `fakeFlags` (`./testing`) — covers: FR-002 — route: package — deps: T006
- [x] T008 Stand-in barrels for the four entries — covers: FR-001, FR-002 — route: package — deps: T007
- [x] T009 Tests beside every subject and each barrel's test — covers: SC-001, SC-002 — route: tests — deps: T008
- [x] T010 Changeset `.changeset/feature-flags-package.md` — covers: SC-001 — route: package — deps: T008
- [ ] T011 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T009
