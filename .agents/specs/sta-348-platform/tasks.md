# Tasks: `@stackra/platform` wave 3

**Input**: `.agents/specs/sta-348-platform/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-platform/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/experience/platform` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1, US2] `./contracts` ports and facet types — covers: FR-003, FR-005 — route: package — deps: T002
- [x] T004 [US1, US3] `Capability` and the vocabulary enums — covers: FR-002 — route: package — deps: T002
- [x] T005 [US3] `PushConfig`, `DesktopConfig`, `PwaConfig`, their shapes and shipped schemas — covers: FR-002 — route: package — deps: T004
- [x] T006 [US1, US2] Memory drivers and `refuse` — covers: FR-002, FR-005 — route: package — deps: T003, T004
- [x] T007 [US1, US2, US4] `./browser` web platform, scanner view, web push, share inbox — covers: FR-004, FR-007 — route: package — deps: T006
- [x] T008 [US5] `./electron` `Bridge`, `PickFolderBridge`, `ElectronPlatformDriver` — covers: FR-004, FR-006 — route: package — deps: T007
- [x] T009 [US4] `./native` push transports — covers: FR-004 — route: package — deps: T005
- [x] T010 `./worker` Turnstile verifier — covers: FR-004 — route: package — deps: T003
- [x] T011 [US5] `./sw` handlers — covers: FR-004, FR-007 — route: package — deps: T007
- [x] T012 [US1, US2, US4] `./react` hooks and `ScannerView`, `./testing` `fakePlatform` — covers: FR-004 — route: package — deps: T006
- [x] T013 Stand-in barrels for the nine entries — covers: FR-001, FR-003 — route: package — deps: T008 to T012
- [x] T014 Tests beside every subject and the barrel tests — covers: SC-002, SC-003 — route: tests — deps: T013
- [x] T015 Changeset `.changeset/platform-package.md` — covers: SC-001 — route: package — deps: T013
- [ ] T016 Catalog entries for `expo-notifications` and `fake-indexeddb` (owner) — covers: FR-001 — route: steward — deps: T002
- [ ] T017 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T014, T016
