# Tasks: `@stackra/state` wave 2

**Input**: `.agents/specs/sta-348-state/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-state/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, LICENSE, CHANGELOG) in `packages/state/state` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] [US2] `Store`, its types, bookkeeping, `registerStores`, `storeKeyOf`, `commitStore`, `hydrateStore`, `subscribeStore`, `storeVersion` — covers: FR-002, FR-004 — route: package — deps: T002
- [x] T004 [US4] `StateOptions`, the shipped schema, `StateConfig` — covers: FR-002 — route: package — deps: T002
- [x] T005 [US3] `signal`, `Signal`, `useSignal`, `useStore` — covers: FR-003 — route: package — deps: T003
- [x] T006 [US4] `MemoryStoreStorage`, `createStore`, `mountStore`, `MountedStore` — covers: FR-003 — route: package — deps: T003
- [x] T007 Stand-in barrels for `.`, `./react`, `./testing` — covers: FR-002, FR-003 — route: package — deps: T004, T005, T006
- [x] T008 Tests beside every subject and the barrel tests — covers: SC-002, SC-003 — route: tests — deps: T007
- [x] T009 Changeset `.changeset/state-package.md` — covers: SC-001 — route: package — deps: T007
- [ ] T010 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T008
- [ ] T011 Gen: emit `registerStores` from the manifest's `stores` section in `#stackra/wiring` — covers: SC-001 — route: gen — deps: T007
