# Tasks: `@stackra/storage` wave 2

**Input**: `.agents/specs/sta-348-storage/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-storage/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/data/storage` — covers: FR-001, FR-007 — route: package — deps: T001
- [x] T003 [US1, US4] `packages/data/storage/src/contracts` `Storage`, `StorageAreaHandle`, `StoredRecord`, `StorageWriteOptions` — covers: FR-003 — route: package — deps: T002
- [x] T004 [US2] `StorageArea`, `OfflineStore` — covers: FR-002 — route: package — deps: T002
- [x] T005 [US1, US2] `registerStorageKeys`, `StorageKey`, the internal `storageKeyOf` — covers: FR-002, FR-006 — route: package — deps: T004
- [x] T006 [US1, US3] `createStorageArea` (JSON, expiry, schema checks, backends) — covers: FR-005 — route: package — deps: T003, T005
- [x] T007 [US2, US4] `AreaStorageDriver`, `MemoryStorageDriver` — covers: FR-002 — route: package — deps: T006
- [x] T008 [US3] `packages/data/storage/src/browser` `WebStorageDriver` — covers: FR-004 — route: package — deps: T007
- [x] T009 [US1, US4] `packages/data/storage/src/react` `usePrefs`, `packages/data/storage/src/testing` `fakeStorage` — covers: FR-004 — route: package — deps: T007
- [x] T010 Stand-in barrels for the five entries — covers: FR-001, FR-003 — route: package — deps: T008, T009
- [x] T011 Tests beside every subject and the barrel tests — covers: SC-002, SC-003 — route: tests — deps: T010
- [x] T012 Changeset `.changeset/storage-package.md` — covers: SC-001 — route: package — deps: T010
- [ ] T013 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T011
