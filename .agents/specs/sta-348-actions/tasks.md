# Tasks: `@stackra/actions` wave 3

**Input**: `.agents/specs/sta-348-actions/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-actions/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/application/actions` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] Ports and exchanged types in `packages/application/actions/src/contracts/` — covers: FR-005 — route: package — deps: T002
- [x] T004 [US1] [US2] Kind bases, enums, option and context types — covers: FR-002, FR-003 — route: package — deps: T003
- [x] T005 [US2] Slots, `registerExtensions`, `connectExtensions`, `ExtensionTable` — covers: FR-007 — route: package — deps: T004
- [x] T006 [US1] `ActionPipeline`, `RequestContext`, memory drivers, refusals, zoned time, `registerActions` — covers: FR-004, FR-005, FR-007 — route: package — deps: T004
- [x] T007 [US1] `RateLimitOptions`, `RATE_LIMIT_CONFIG_SCHEMA`, `RateLimitConfig` — covers: FR-006 — route: package — deps: T002
- [x] T008 `AsyncContextStorageDriver` in `packages/application/actions/src/node` — covers: FR-005 — route: package — deps: T003
- [x] T009 [US1] [US3] `packages/application/actions/src/testing`: `run`, fake contexts, `extension`, the plugin — covers: FR-008 — route: package — deps: T006
- [x] T010 Stand-in barrels for the four entries — covers: FR-001 — route: package — deps: T009
- [x] T011 Tests beside every subject and the barrel tests — covers: SC-002 — route: tests — deps: T010
- [x] T012 Changeset `.changeset/actions-package.md` — covers: SC-001 — route: package — deps: T010
- [ ] T013 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T011
- [x] T014 [US1] `scope?: ScopeRef` on `CallOptions`, `CallDescriptor` and `ExtensionContext`, copied through `ActionPipeline`; pipeline and fake-context tests — covers: FR-004, P-004 — route: package — deps: T006
- [x] T015 [US1] `yesterday` and `custom` in `periodOf`'s `windowOf`, with tests — covers: FR-004, P-004 — route: package — deps: T006
- [x] T016 [US1] `JobCron.perTenant` renamed `perScope`; `Action` test, README and AGENTS — covers: FR-002, P-002 — route: package — deps: T004
