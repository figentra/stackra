# Tasks: `@stackra/assets` wave 3

**Input**: `.agents/specs/sta-348-assets/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-assets/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/data/assets` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] `AssetKey`, `AssetEntry`, `AssetTree`, `ResolvedAsset` — covers: FR-002 — route: package — deps: T002
- [x] T004 [US1] `isRelativePath`, `parseAssetKey`, `assets` — covers: FR-002, FR-004, SC-001 — route: package — deps: T003
- [x] T005 [US2] `AssetLibrary` and the `.` barrel — covers: FR-002, FR-005 — route: package — deps: T004
- [x] T006 [US2] `useAsset` and the `packages/data/assets/src/react` barrel — covers: FR-003, SC-001 — route: package — deps: T005
- [x] T007 Tests beside every subject and a barrel test per entry — covers: SC-002, SC-003 — route: tests — deps: T006
- [x] T008 Changeset `.changeset/assets-package.md` — covers: SC-001 — route: package — deps: T006
- [ ] T009 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T007
