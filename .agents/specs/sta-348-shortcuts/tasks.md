# Tasks: `@stackra/shortcuts` wave 3

**Input**: `.agents/specs/sta-348-shortcuts/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-shortcuts/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/experience/shortcuts` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] `Shortcut`, `ShortcutOptions`, `ShortcutClass`, `RunnableShortcut`, `normalizeShortcutKeys`, `KEY_NAMES`, `MODIFIERS` — covers: FR-002 — route: package — deps: T002
- [x] T004 [US2] `ShortcutConflictKind`, `ShortcutConflict`, `findShortcutConflicts`, `registerShortcuts`, `SHORTCUT_ENTRIES` — covers: FR-003 — route: package — deps: T003
- [x] T005 [US3] `ShortcutContext`, `ShortcutContextPart`, `contributeShortcutContext`, `createShortcutContext` — covers: FR-004 — route: package — deps: T003
- [x] T006 [US3] `useShortcuts`, `ShortcutItem`, `useRunShortcut`, `useShortcut`, `ShortcutKeys`, `formatShortcutKeys`, `isApplePlatform` — covers: FR-002 — route: package — deps: T004, T005
- [x] T007 [US4] `ShortcutBindings`, `toHotkey`, `CHORD_TIMEOUT` — covers: FR-003 — route: package — deps: T006
- [x] T008 [US5] `runShortcut`, `registerShortcutTestingPart` and their types — covers: FR-002, FR-004 — route: package — deps: T005
- [x] T009 Stand-in barrels for the three entries — covers: FR-001, FR-002 — route: package — deps: T007, T008
- [x] T010 Tests beside every subject and each barrel's test — covers: SC-001, SC-002 — route: tests — deps: T009
- [x] T011 Changeset `.changeset/shortcuts-package.md` — covers: SC-001 — route: package — deps: T009
- [ ] T012 Owner: add `@tanstack/hotkeys` (exact pin) to `catalog:frontend`; then `pnpm install`, tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010
