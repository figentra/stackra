# Tasks: `@stackra/cache` wave 2

**Input**: `.agents/specs/sta-348-cache/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-cache/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/runtime/cache` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] [US2] `Cache`, `CacheNamespace` ports and the `CacheKey` brand in `src/contracts/` — covers: FR-002, FR-004, FR-006 — route: package — deps: T002
- [x] T004 [US2] `CacheKey.of` and `coversKey` — covers: FR-006 — route: package — deps: T003
- [x] T005 [US4] `CacheOptions`, `CACHE_CONFIG_SCHEMA`, `CacheConfig` — covers: FR-003 — route: package — deps: T002
- [x] T006 [US1] [US2] [US3] `MemoryCacheDriver`, `SharedCacheNamespaceDriver` — covers: FR-004, FR-005 — route: package — deps: T004, T005
- [x] T007 Stand-in barrels for `.` and `./contracts` — covers: FR-001, FR-002, FR-003 — route: package — deps: T006
- [x] T008 Tests beside every subject and the barrel tests — covers: SC-002 — route: tests — deps: T007
- [x] T009 Changeset `.changeset/cache-package.md` — covers: SC-001 — route: package — deps: T007
- [ ] T010 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T008
